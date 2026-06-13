import { Module, forwardRef } from '@nestjs/common';

import { ListingModule } from '../listing/listing.module';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';
import { AppleIAPController } from './apple/apple-iap.controller';
import { AppleIAPWebhookController } from './apple/apple-iap-webhook.controller';
import { AppleIAPRepo } from './apple/apple-iap.repo';
import { AppleIAPService } from './apple/apple-iap.service';
import { AppleIAPWebhookService } from './apple/apple-iap-webhook.service';
import { PaymobCheckoutService } from './checkout/paymob-checkout.service';
import { CreditsService } from './credits/credits.service';
import { ListingExpiryService } from './expiry/listing-expiry.service';
import { ListingPromotionService } from './listing-promotion/listing-promotion.service';
import { PaymentFulfillmentService } from './paymob/payment-fulfillment.service';
import { PaymobWebhookController } from './paymob/paymob-webhook.controller';
import { PaymobWebhookService } from './paymob/paymob-webhook.service';
import { PaymentsModule } from './payments.module';
import { QuotaService } from './quota/quota.service';
import { SeriousRequestUnlockRepository } from './quota/serious-request-unlock.repository';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionWalletService } from './subscription/subscription-wallet.service';
import { SubscriptionService } from './subscription/subscription.service';

@Module({
  imports: [UserModule, forwardRef(() => ListingModule), AuthModule, PaymentsModule],
  controllers: [
    SubscriptionsController,
    PaymobWebhookController,
    AppleIAPController,
    AppleIAPWebhookController,
  ],
  providers: [
    SeriousRequestUnlockRepository,
    QuotaService,
    CreditsService,
    SubscriptionService,
    SubscriptionWalletService,
    PaymobCheckoutService,
    ListingPromotionService,
    PaymentFulfillmentService,
    PaymobWebhookService,
    ListingExpiryService,
    AppleIAPRepo,
    AppleIAPService,
    AppleIAPWebhookService,
  ],
  exports: [
    SeriousRequestUnlockRepository,
    QuotaService,
    CreditsService,
    SubscriptionService,
    PaymentsModule,
    ListingPromotionService,
  ],
})
export class BillingModule {}
