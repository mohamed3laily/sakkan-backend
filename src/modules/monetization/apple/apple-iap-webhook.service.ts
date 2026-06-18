import { Injectable, Logger } from '@nestjs/common';

import { LogAction } from 'src/common/logging';
import { AppleIAPRepo } from './apple-iap.repo';
import { AppleIAPService } from './apple-iap.service';

@Injectable()
export class AppleIAPWebhookService {
  private readonly logger = new Logger(AppleIAPWebhookService.name);

  constructor(
    private readonly repo: AppleIAPRepo,
    private readonly appleIAPService: AppleIAPService,
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

    if (notificationType === 'REFUND') {
      await this.handleRefund(transactionId);
    } else {
      // ONE_TIME_CHARGE and other non-renewing events are fulfilled synchronously
      // in verifyAndFulfill when the iOS app calls POST /v1/subscriptions/apple/verify-purchase.
      // No server-side action is needed here.
      this.logger.log(`Apple webhook: type '${notificationType}' — no action`);
    }
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
