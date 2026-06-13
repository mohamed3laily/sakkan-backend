import { Injectable, Logger } from '@nestjs/common';

import { LogAction } from 'src/common/logging';
import { AppleIAPRepo } from './apple-iap.repo';
import { AppleIAPService } from './apple-iap.service';
import { PaymentFulfillmentService } from '../paymob/payment-fulfillment.service';

@Injectable()
export class AppleIAPWebhookService {
  private readonly logger = new Logger(AppleIAPWebhookService.name);

  constructor(
    private readonly repo: AppleIAPRepo,
    private readonly appleIAPService: AppleIAPService,
    private readonly fulfillment: PaymentFulfillmentService,
  ) {}

  async handleNotification(body: unknown): Promise<void> {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      this.logger.warn('Apple webhook: invalid body shape');
      return;
    }

    const raw = body as Record<string, unknown>;
    const signedPayload = raw['signedPayload'];

    if (typeof signedPayload !== 'string') {
      this.logger.warn('Apple webhook: missing signedPayload');
      return;
    }

    let notificationType: string;
    let transactionId: string | undefined;

    try {
      const { verifier } = this.appleIAPService;
      const decoded = await verifier.verifyAndDecodeNotification(signedPayload);

      notificationType = decoded.notificationType ?? '';
      const txPayload = decoded.data?.signedTransactionInfo
        ? await verifier.verifyAndDecodeTransaction(decoded.data.signedTransactionInfo)
        : null;

      transactionId = txPayload?.transactionId;
    } catch (err) {
      this.logger.error('Apple webhook: failed to verify/decode signedPayload', err);
      return;
    }

    this.logger.log(
      { action: LogAction.APPLE_IAP_WEBHOOK_RECEIVED, notificationType, transactionId },
      'Apple IAP webhook received',
    );

    if (notificationType === 'SUBSCRIBED' || notificationType === 'DID_RENEW') {
      await this.handleRenewal(transactionId);
    } else if (
      notificationType === 'DID_FAIL_TO_RENEW' ||
      notificationType === 'EXPIRED' ||
      notificationType === 'GRACE_PERIOD_EXPIRED'
    ) {
      await this.handleExpiry(transactionId);
    } else if (notificationType === 'REFUND') {
      await this.handleRefund(transactionId);
    } else {
      this.logger.log(`Apple webhook: type '${notificationType}' — no action`);
    }
  }

  private async handleRenewal(transactionId: string | undefined): Promise<void> {
    if (!transactionId) return;

    const payment = await this.repo.findPaymentByAppleTransactionId(transactionId);
    if (!payment) {
      this.logger.log(`Apple webhook renewal: no payment for transactionId=${transactionId}`);
      return;
    }

    if (payment.status === 'success') {
      this.logger.log(`Apple webhook renewal: payment ${payment.id} already success`);
      return;
    }

    try {
      await this.repo.finalizePayment(payment.id, (tx) =>
        this.fulfillment.fulfillSubscriptionTx(tx, payment),
      );
      this.logger.log(`Apple webhook: subscription renewed for payment ${payment.id}`);
    } catch (err) {
      this.logger.error(`Apple webhook: renewal failed for payment ${payment.id}`, err);
    }
  }

  private async handleExpiry(transactionId: string | undefined): Promise<void> {
    if (!transactionId) return;

    const payment = await this.repo.findPaymentByAppleTransactionId(transactionId);
    if (!payment) {
      this.logger.log(`Apple webhook expiry: no payment for transactionId=${transactionId}`);
      return;
    }

    await this.repo.expireUserSubscription(payment.userId);
    this.logger.log(`Apple webhook: subscription expired for user ${payment.userId}`);
  }

  private async handleRefund(transactionId: string | undefined): Promise<void> {
    if (!transactionId) return;

    const payment = await this.repo.findPaymentByAppleTransactionId(transactionId);
    if (!payment) {
      this.logger.log(`Apple webhook refund: no payment for transactionId=${transactionId}`);
      return;
    }

    await this.repo.markPaymentRefunded(payment.id);
    this.logger.log(`Apple webhook: payment ${payment.id} marked as refunded`);
  }
}
