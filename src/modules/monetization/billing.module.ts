import { Module } from '@nestjs/common';

import { ListingModule } from '../listing/listing.module';
import { UserModule } from '../user/user.module';
import { PaymobCheckoutService } from './checkout/paymob-checkout.service';
import { CreditsService } from './credits/credits.service';
import { ListingPromotionController } from './listing-promotion/listing-promotion.controller';
import { ListingPromotionService } from './listing-promotion/listing-promotion.service';
import { PaymentFulfillmentService } from './paymob/payment-fulfillment.service';
import { PaymobWebhookController } from './paymob/paymob-webhook.controller';
import { PaymobWebhookService } from './paymob/paymob-webhook.service';
import { PaymentsModule } from './payments.module';
import { QuotaService } from './quota/quota.service';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionWalletService } from './subscription/subscription-wallet.service';
import { SubscriptionService } from './subscription/subscription.service';

/**
 * Billing: subscriptions, credits/quota, listing promotion, Paymob checkout + webhooks.
 */
@Module({
  imports: [UserModule, ListingModule, PaymentsModule],
  controllers: [SubscriptionsController, ListingPromotionController, PaymobWebhookController],
  providers: [
    QuotaService,
    CreditsService,
    SubscriptionService,
    SubscriptionWalletService,
    PaymobCheckoutService,
    ListingPromotionService,
    PaymentFulfillmentService,
    PaymobWebhookService,
  ],
  exports: [QuotaService, CreditsService, SubscriptionService, PaymentsModule],
})
export class BillingModule {}
