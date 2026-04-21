import { Injectable, Logger } from '@nestjs/common';

import { payments } from '../../db/schemas/monetization/payments';
import { CreditsService } from '../credits/credits.service';
import { ListingPromotionService } from '../listing-promotion/listing-promotion.service';
import { SubscriptionService } from '../subscription/subscription.service';

type PaymentRow = typeof payments.$inferSelect;

type SubscriptionMetadata = { plan_id?: number };
type CreditsMetadata = { listing_id?: number };

@Injectable()
export class PaymentFulfillmentService {
  private readonly logger = new Logger(PaymentFulfillmentService.name);

  constructor(
    private readonly creditsService: CreditsService,
    private readonly subscriptionService: SubscriptionService,
    private readonly listingPromotionService: ListingPromotionService,
  ) {}

  async fulfillSubscription(payment: PaymentRow) {
    const { plan_id: planId } = this.getSubscriptionMeta(payment.metadata);
    if (planId == null) {
      this.logger.warn(`Subscription payment ${payment.id} missing plan_id in metadata`);
      return;
    }

    await this.subscriptionService.activateSubscription({
      userId: payment.userId,
      planId,
      paymentId: payment.id,
      paymobOrderId: payment.paymobOrderId ?? '',
    });

    this.logger.log(`Subscription activated: user=${payment.userId} plan=${planId}`);
  }

  async fulfillSeriousRequest(payment: PaymentRow) {
    const { listing_id: listingId } = this.getCreditsMeta(payment.metadata);

    await this.creditsService.addCredits(payment.userId, 'serious', 1, payment.id);

    if (listingId != null) {
      const result = await this.listingPromotionService.promoteToPremiumByPayment(
        listingId,
        payment.id,
      );
      if (!result) {
        this.logger.warn(
          `Serious publish skipped: listing ${listingId} not found for payment ${payment.id}`,
        );
      }
    }
  }

  async fulfillFeaturedSingle(payment: PaymentRow) {
    const { listing_id: listingId } = this.getCreditsMeta(payment.metadata);

    await this.creditsService.addCredits(payment.userId, 'featured', 1, payment.id);

    if (listingId != null) {
      const result = await this.listingPromotionService.promoteToPremiumByPayment(
        listingId,
        payment.id,
      );
      if (!result) {
        this.logger.warn(
          `Featured publish skipped: listing ${listingId} not found for payment ${payment.id}`,
        );
      }
    }
  }

  async fulfillFeaturedBundle(payment: PaymentRow) {
    await this.creditsService.addCredits(payment.userId, 'featured', 15, payment.id);

    this.logger.log(`Featured bundle activated: user=${payment.userId} +15 credits`);
  }

  private getSubscriptionMeta(metadata: PaymentRow['metadata']): SubscriptionMetadata {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
      return {};
    }
    return metadata as SubscriptionMetadata;
  }

  private getCreditsMeta(metadata: PaymentRow['metadata']): CreditsMetadata {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
      return {};
    }
    return metadata as CreditsMetadata;
  }
}
