import {
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';

import { paymobOrderIdFromTransactionObj } from './paymob-hmac.util';
import { PaymobService } from './paymob.service';
import { PaymentFulfillmentService } from './payment-fulfillment.service';

@Injectable()
export class PaymobWebhookService {
  private readonly logger = new Logger(PaymobWebhookService.name);

  constructor(
    private readonly paymobService: PaymobService,
    private readonly fulfillment: PaymentFulfillmentService,
  ) {}

  async handleWebhook(payload: unknown, hmac: string): Promise<void> {
    const type =
      payload &&
      typeof payload === 'object' &&
      !Array.isArray(payload) &&
      typeof (payload as Record<string, unknown>)['type'] === 'string'
        ? (payload as Record<string, unknown>)['type']
        : undefined;

    if (type !== 'TRANSACTION') {
      this.logger.log(`Paymob webhook ignored (type=${String(type)})`);
      return;
    }

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      this.logger.warn('Paymob webhook: invalid body');
      return;
    }

    const objRaw = (payload as Record<string, unknown>)['obj'];
    if (!objRaw || typeof objRaw !== 'object' || Array.isArray(objRaw)) {
      this.logger.warn('Paymob TRANSACTION webhook missing obj');
      return;
    }

    const obj = objRaw as Record<string, unknown>;
    const orderIdStr = paymobOrderIdFromTransactionObj(obj);
    if (!orderIdStr) {
      this.logger.warn('Paymob TRANSACTION webhook missing order id');
      return;
    }

    if (!this.paymobService.verifyWebhookHmac(payload, hmac)) {
      throw new UnauthorizedException('INVALID_PAYMOB_HMAC');
    }

    const payment = await this.paymobService.findPaymentByPaymobOrder(orderIdStr);

    if (!payment) {
      this.logger.warn(`No internal payment found for Paymob order ${orderIdStr}`);
      return;
    }

    if (payment.status === 'success' || payment.status === 'failed') {
      this.logger.log(`Payment ${payment.id} already processed — skipping`);
      return;
    }

    const success = obj['success'];
    const errorOccured = obj['error_occured'];
    const txnId = obj['id'];

    if (success !== true || errorOccured === true) {
      await this.paymobService.markPaymentFailed(payment.id);
      this.logger.log(`Payment ${payment.id} marked as failed`);
      return;
    }

    const txnIdStr = String(txnId);

    try {
      switch (payment.type) {
        case 'subscription':
          await this.fulfillment.fulfillSubscription(payment);
          await this.paymobService.markPaymentSuccess(payment.id, txnIdStr);
          break;
        case 'serious_request':
          await this.paymobService.finalizePendingPaymentWithFulfillment(
            payment.id,
            txnIdStr,
            (tx) => this.fulfillment.fulfillSeriousRequestTx(tx, payment),
          );
          break;
        case 'featured_single':
          await this.paymobService.finalizePendingPaymentWithFulfillment(
            payment.id,
            txnIdStr,
            (tx) => this.fulfillment.fulfillFeaturedSingleTx(tx, payment),
          );
          break;
        case 'featured_bundle':
          await this.paymobService.finalizePendingPaymentWithFulfillment(
            payment.id,
            txnIdStr,
            (tx) => this.fulfillment.fulfillFeaturedBundleTx(tx, payment),
          );
          break;
        default: {
          const unknownType = payment.type as unknown;
          this.logger.warn(`Unknown payment type: ${String(unknownType)}`);
        }
      }
    } catch (err) {
      this.logger.error(`Post-payment handler failed for payment ${payment.id}`, err);
      throw new InternalServerErrorException('PAYMENT_FULFILLMENT_FAILED');
    }
  }
}
