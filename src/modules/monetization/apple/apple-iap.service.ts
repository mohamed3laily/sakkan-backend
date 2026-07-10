import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  APIError,
  APIException,
  AppStoreServerAPIClient,
  Environment,
  SignedDataVerifier,
  type JWSTransactionDecodedPayload,
} from '@apple/app-store-server-library';
import * as https from 'https';

import { PaymentFulfillmentService } from '../paymob/payment-fulfillment.service';
import { LogAction } from 'src/common/logging';
import { AppleIAPRepo } from './apple-iap.repo';
import { VerifyApplePurchaseDto } from './dto/verify-apple-purchase.dto';

/** Apple Root CA DER certificate URLs (https://www.apple.com/certificateauthority/) */
const APPLE_ROOT_CA_URLS = [
  'https://www.apple.com/appleca/AppleIncRootCertificate.cer',
  'https://www.apple.com/certificateauthority/AppleRootCA-G2.cer',
  'https://www.apple.com/certificateauthority/AppleRootCA-G3.cer',
];

function fetchBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      })
      .on('error', reject);
  });
}

@Injectable()
export class AppleIAPService implements OnModuleInit {
  private readonly logger = new Logger(AppleIAPService.name);

  private readonly bundleId: string;
  private readonly keyId: string;
  private readonly issuerId: string;
  private readonly privateKey: string;
  private readonly isSandbox: boolean;
  /** Apple's numeric app ID (App Store Connect → App Information). Required by
   * `SignedDataVerifier` when targeting the Production environment. */
  private readonly appAppleId?: string;

  /** Exposed so the webhook service can reuse it without re-initialising.
   * Points at the environment configured via `APPLE_IAP_SANDBOX`. */
  verifier!: SignedDataVerifier;
  private sandboxApiClient!: AppStoreServerAPIClient;
  private sandboxVerifier!: SignedDataVerifier;
  private productionApiClient?: AppStoreServerAPIClient;
  private productionVerifier?: SignedDataVerifier;

  constructor(
    private readonly config: ConfigService,
    private readonly repo: AppleIAPRepo,
    private readonly fulfillment: PaymentFulfillmentService,
  ) {
    this.bundleId = this.config.getOrThrow('APPLE_BUNDLE_ID');
    this.keyId = this.config.getOrThrow('APPLE_APP_STORE_CONNECT_KEY_ID');
    this.issuerId = this.config.getOrThrow('APPLE_APP_STORE_CONNECT_ISSUER_ID');
    this.privateKey = this.config
      .getOrThrow<string>('APPLE_APP_STORE_CONNECT_PRIVATE_KEY')
      .replace(/\\n/g, '\n');
    this.isSandbox = this.config.get<string>('APPLE_IAP_SANDBOX') !== 'false';
    this.appAppleId = this.config.get<string>('APPLE_APP_APPLE_ID');
  }

  async onModuleInit() {
    const rootCAs = await this.loadAppleRootCAs();

    this.sandboxApiClient = new AppStoreServerAPIClient(
      this.privateKey,
      this.keyId,
      this.issuerId,
      this.bundleId,
      Environment.SANDBOX,
    );
    this.sandboxVerifier = new SignedDataVerifier(
      rootCAs,
      true,
      Environment.SANDBOX,
      this.bundleId,
    );

    // Production requires `appAppleId`; only stand it up once the app has a real
    // App Store release and the ID is configured, otherwise every call would 401.
    if (!this.isSandbox && this.appAppleId) {
      this.productionApiClient = new AppStoreServerAPIClient(
        this.privateKey,
        this.keyId,
        this.issuerId,
        this.bundleId,
        Environment.PRODUCTION,
      );
      this.productionVerifier = new SignedDataVerifier(
        rootCAs,
        true,
        Environment.PRODUCTION,
        this.bundleId,
        Number(this.appAppleId),
      );
    } else if (!this.isSandbox) {
      this.logger.warn(
        'APPLE_IAP_SANDBOX=false but APPLE_APP_APPLE_ID is not set — falling back to Sandbox only, Production purchases will fail verification',
      );
    }

    this.verifier = this.isSandbox
      ? this.sandboxVerifier
      : (this.productionVerifier ?? this.sandboxVerifier);

    this.logger.log(`Apple IAP initialized (${this.isSandbox ? 'Sandbox' : 'Production'})`);
  }

  /**
   * Verify an Apple IAP transaction and fulfill the corresponding subscription or credits.
   * Idempotent: throws APPLE_TRANSACTION_ALREADY_PROCESSED if already fulfilled.
   */
  async verifyAndFulfill(userId: number, dto: VerifyApplePurchaseDto) {
    const { transactionId, productId } = dto;

    const existing = await this.repo.findPaymentByAppleTransactionId(transactionId);
    if (existing?.status === 'success') {
      this.logger.log(`Apple IAP ${transactionId} already processed (payment ${existing.id})`);
      throw new ConflictException('APPLE_TRANSACTION_ALREADY_PROCESSED');
    }

    const decoded = await this.verifyTransaction(transactionId);

    if (decoded.productId !== productId) {
      this.logger.warn(
        `Apple IAP product mismatch: client=${productId}, Apple=${decoded.productId}`,
      );
      throw new BadRequestException('APPLE_IAP_VERIFICATION_FAILED');
    }

    const { paymentType, planId, creditsToAdd, creditType } = await this.resolveProduct(productId);

    const metadata: Record<string, unknown> =
      paymentType === 'subscription'
        ? { plan_id: planId }
        : { credits_to_add: creditsToAdd, credit_type: creditType };

    const paymentRow = await this.repo.insertPayment({
      userId,
      type: paymentType,
      status: 'pending',
      amountPiasters: 0,
      appleTransactionId: transactionId,
      metadata,
    });

    try {
      await this.repo.finalizePayment(paymentRow.id, (tx) =>
        this.fulfillByType(paymentType, tx, paymentRow),
      );
    } catch (err) {
      this.logger.error(`Apple IAP fulfillment failed for payment ${paymentRow.id}`, err);
      throw new InternalServerErrorException('PAYMENT_FULFILLMENT_FAILED');
    }

    this.logger.log(
      {
        action: LogAction.APPLE_IAP_VERIFIED,
        userId,
        transactionId,
        productId,
        paymentId: paymentRow.id,
      },
      'Apple IAP purchase verified and fulfilled',
    );

    return { success: true };
  }

  // ---------------------------------------------------------------------------
  // Helpers used by the webhook service
  // ---------------------------------------------------------------------------

  async verifyTransaction(transactionId: string): Promise<JWSTransactionDecodedPayload> {
    // A bare transactionId doesn't reveal its environment. Apple's documented approach:
    // https://developer.apple.com/documentation/appstoreserverapi/get_transaction_info
    // try Production first, and only fall back to Sandbox on TRANSACTION_ID_NOT_FOUND.
    // This matters even in "production" deployments because TestFlight/Xcode-signed
    // builds always produce Sandbox transactions.
    if (this.productionApiClient && this.productionVerifier) {
      try {
        return await this.fetchAndVerify(
          this.productionApiClient,
          this.productionVerifier,
          transactionId,
        );
      } catch (err) {
        if (!(err instanceof APIException && err.apiError === APIError.TRANSACTION_ID_NOT_FOUND)) {
          this.logger.error('Apple IAP verification failed (Production)', err);
          throw new BadRequestException('APPLE_IAP_VERIFICATION_FAILED');
        }
        this.logger.log(
          `Transaction ${transactionId} not found in Production, retrying in Sandbox`,
        );
      }
    }

    try {
      return await this.fetchAndVerify(this.sandboxApiClient, this.sandboxVerifier, transactionId);
    } catch (err) {
      this.logger.error('Apple IAP verification failed (Sandbox)', err);
      throw new BadRequestException('APPLE_IAP_VERIFICATION_FAILED');
    }
  }

  private async fetchAndVerify(
    apiClient: AppStoreServerAPIClient,
    verifier: SignedDataVerifier,
    transactionId: string,
  ): Promise<JWSTransactionDecodedPayload> {
    const response = await apiClient.getTransactionInfo(transactionId);
    if (!response.signedTransactionInfo) {
      throw new Error('Apple API returned no signedTransactionInfo');
    }
    return await verifier.verifyAndDecodeTransaction(response.signedTransactionInfo);
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  private async resolveProduct(productId: string): Promise<{
    paymentType: 'subscription' | 'featured_bundle' | 'featured_single' | 'serious_request';
    planId?: number;
    creditsToAdd?: number;
    creditType?: 'featured' | 'serious';
  }> {
    const plan = await this.repo.findPlanByAppleProductId(productId);
    if (plan) {
      return { paymentType: 'subscription', planId: plan.id };
    }

    const cp = await this.repo.findCreditProductByAppleProductId(productId);
    if (!cp) {
      throw new NotFoundException('APPLE_IAP_PRODUCT_NOT_FOUND');
    }

    const paymentType =
      cp.creditType === 'featured' && cp.credits > 1
        ? 'featured_bundle'
        : cp.creditType === 'featured'
          ? 'featured_single'
          : 'serious_request';

    return { paymentType, creditsToAdd: cp.credits, creditType: cp.creditType };
  }

  private fulfillByType(
    paymentType: string,
    tx: Parameters<typeof this.fulfillment.fulfillSubscriptionTx>[0],
    paymentRow: Parameters<typeof this.fulfillment.fulfillSubscriptionTx>[1],
  ) {
    switch (paymentType) {
      case 'subscription':
        return this.fulfillment.fulfillSubscriptionTx(tx, paymentRow);
      case 'serious_request':
        return this.fulfillment.fulfillSeriousRequestTx(tx, paymentRow);
      case 'featured_single':
        return this.fulfillment.fulfillFeaturedSingleTx(tx, paymentRow);
      case 'featured_bundle':
        return this.fulfillment.fulfillFeaturedBundleTx(tx, paymentRow);
      default:
        return Promise.resolve();
    }
  }

  private async loadAppleRootCAs(): Promise<Buffer[]> {
    const certs: Buffer[] = [];
    for (const url of APPLE_ROOT_CA_URLS) {
      try {
        certs.push(await fetchBuffer(url));
      } catch (err) {
        this.logger.warn(`Failed to download Apple root CA from ${url}`, err);
      }
    }
    if (certs.length === 0) {
      this.logger.warn('No Apple root CAs loaded — JWS verification will fail');
    }
    return certs;
  }
}
