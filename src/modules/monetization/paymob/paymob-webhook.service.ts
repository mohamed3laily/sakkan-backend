import {
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';

import type { PaymobWebhookPayload } from '../types';
import { PaymobService } from './paymob.service';
import { PaymentFulfillmentService } from './payment-fulfillment.service';

@Injectable()
export class PaymobWebhookService {
  private readonly logger = new Logger(PaymobWebhookService.name);

  constructor(
    private readonly paymobService: PaymobService,
    private readonly fulfillment: PaymentFulfillmentService,
  ) {}

  async handleWebhook(payload: PaymobWebhookPayload, hmac: string): Promise<void> {
    if (payload.type !== 'TRANSACTION') {
      this.logger.log(`Paymob webhook ignored (type=${String(payload.type)})`);
      return;
    }

    if (!payload.obj?.order?.id) {
      this.logger.warn('Paymob TRANSACTION webhook missing obj.order');
      return;
    }

    if (!this.paymobService.verifyWebhookHmac(payload, hmac)) {
      throw new UnauthorizedException('INVALID_PAYMOB_HMAC');
    }

    const obj = payload.obj;

    const payment = await this.paymobService.findPaymentByPaymobOrder(String(obj.order.id));

    if (!payment) {
      this.logger.warn(`No internal payment found for Paymob order ${obj.order.id}`);
      return;
    }

    if (payment.status === 'success' || payment.status === 'failed') {
      this.logger.log(`Payment ${payment.id} already processed — skipping`);
      return;
    }

    if (!obj.success || obj.error_occured) {
      await this.paymobService.markPaymentFailed(payment.id);
      this.logger.log(`Payment ${payment.id} marked as failed`);
      return;
    }

    await this.paymobService.markPaymentSuccess(payment.id, String(obj.id));

    try {
      switch (payment.type) {
        case 'subscription':
          await this.fulfillment.fulfillSubscription(payment);
          break;
        case 'serious_request':
          await this.fulfillment.fulfillSeriousRequest(payment);
          break;
        case 'featured_single':
          await this.fulfillment.fulfillFeaturedSingle(payment);
          break;
        case 'featured_bundle':
          await this.fulfillment.fulfillFeaturedBundle(payment);
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
