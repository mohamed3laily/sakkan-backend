import { Module } from '@nestjs/common';

import { PaymobService } from './paymob/paymob.service';

/**
 * Paymob payment gateway client only. Webhook + fulfillment stay in BillingModule
 * to avoid circular imports with quota/credits/subscription services.
 */
@Module({
  providers: [PaymobService],
  exports: [PaymobService],
})
export class PaymentsModule {}
