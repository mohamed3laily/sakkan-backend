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

  /** Exposed so the webhook service can reuse it without re-initialising. */
  verifier!: SignedDataVerifier;
  private apiClient!: AppStoreServerAPIClient;

  constructor(
    private readonly config: ConfigService,
    private readonly repo: AppleIAPRepo,
    private readonly fulfillment: PaymentFulfillmentService,
  ) {
    this.bundleId = this.config.getOrThrow('APPLE_BUNDLE_ID');
    this.keyId = this.config.getOrThrow('APPLE_APP_STORE_CONNECT_KEY_ID');
    this.issuerId = this.config.getOrThrow('APPLE_APP_STORE_CONNECT_ISSUER_ID');
    this.privateKey = this.config.getOrThrow('APPLE_APP_STORE_CONNECT_PRIVATE_KEY');
    this.isSandbox = this.config.get<string>('APPLE_IAP_SANDBOX') !== 'false';
  }

  async onModuleInit() {
    const environment = this.isSandbox ? Environment.SANDBOX : Environment.PRODUCTION;

    this.apiClient = new AppStoreServerAPIClient(
      this.privateKey,
      this.keyId,
      this.issuerId,
      this.bundleId,
      environment,
    );

    const rootCAs = await this.loadAppleRootCAs();
    this.verifier = new SignedDataVerifier(rootCAs, true, environment, this.bundleId);

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

    const { paymentType, planId } = await this.resolveProduct(productId);

    const metadata: Record<string, unknown> =
      paymentType === 'subscription' ? { plan_id: planId } : {};

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
    try {
      const response = await this.apiClient.getTransactionInfo(transactionId);
      if (!response.signedTransactionInfo) {
        throw new Error('Apple API returned no signedTransactionInfo');
      }
      return await this.verifier.verifyAndDecodeTransaction(response.signedTransactionInfo);
    } catch (err) {
      this.logger.error('Apple IAP verification failed', err);
      throw new BadRequestException('APPLE_IAP_VERIFICATION_FAILED');
    }
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  private async resolveProduct(productId: string): Promise<{
    paymentType: 'subscription' | 'featured_bundle' | 'featured_single' | 'serious_request';
    planId?: number;
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

    return { paymentType };
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
