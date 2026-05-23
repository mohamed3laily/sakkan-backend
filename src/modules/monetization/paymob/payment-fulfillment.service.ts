import { Injectable, Logger } from '@nestjs/common';

import { payments } from '../../db/schemas/monetization/payments';
import { LogAction } from 'src/common/logging';
import { CreditsService } from '../credits/credits.service';
import type { AppTransaction } from '../monetization-db.types';
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
      this.logger.warn(
        ({
          action: LogAction.SUBSCRIPTION_ACTIVATED,
          userId: payment.userId,
          paymentId: payment.id,
          reason: 'MISSING_PLAN_ID',
        }),
        'Subscription fulfillment skipped',
      );
      return;
    }

    await this.subscriptionService.activateSubscription({
      userId: payment.userId,
      planId,
      paymentId: payment.id,
      paymobOrderId: payment.paymobOrderId ?? '',
      paidAmountPiasters: payment.amountPiasters,
    });

    this.logger.log(
      ({
        action: LogAction.SUBSCRIPTION_ACTIVATED,
        userId: payment.userId,
        planId,
        paymentId: payment.id,
      }),
      'Subscription activated',
    );
  }

  async fulfillSeriousRequestTx(tx: AppTransaction, payment: PaymentRow) {
    const { listing_id: listingId } = this.getCreditsMeta(payment.metadata);

    await this.creditsService.addCreditsTx(tx, payment.userId, 'serious', 1, payment.id);

    if (listingId != null) {
      const result = await this.listingPromotionService.promoteToPremiumByPaymentInTx(
        tx,
        listingId,
        payment.id,
      );
      if (!result) {
        this.logger.warn(
          ({
            action: LogAction.PREMIUM_LISTING_CREATED,
            userId: payment.userId,
            paymentId: payment.id,
            listingId,
            reason: 'LISTING_NOT_FOUND',
          }),
          'Serious publish skipped',
        );
      }
    }
  }

  async fulfillFeaturedSingleTx(tx: AppTransaction, payment: PaymentRow) {
    const { listing_id: listingId } = this.getCreditsMeta(payment.metadata);

    await this.creditsService.addCreditsTx(tx, payment.userId, 'featured', 1, payment.id);

    if (listingId != null) {
      const result = await this.listingPromotionService.promoteToPremiumByPaymentInTx(
        tx,
        listingId,
        payment.id,
      );
      if (!result) {
        this.logger.warn(
          ({
            action: LogAction.PREMIUM_LISTING_CREATED,
            userId: payment.userId,
            paymentId: payment.id,
            listingId,
            reason: 'LISTING_NOT_FOUND',
          }),
          'Featured publish skipped',
        );
      }
    }
  }

  async fulfillFeaturedBundleTx(tx: AppTransaction, payment: PaymentRow) {
    await this.creditsService.addCreditsTx(tx, payment.userId, 'featured', 15, payment.id);

    this.logger.log(
      ({
        action: LogAction.FEATURED_BUNDLE_ACTIVATED,
        userId: payment.userId,
        paymentId: payment.id,
        credits: 15,
      }),
      'Featured bundle activated',
    );
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
