import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { DrizzleService } from '../../db/drizzle.service';
import { ListingsRepository } from '../../listing/listing.repo';
import type { AppTransaction } from '../monetization-db.types';
import { QuotaService, type SeriousViewResult } from '../quota/quota.service';

@Injectable()
export class ListingPromotionService {
  constructor(
    private readonly quotaService: QuotaService,
    private readonly listingsRepository: ListingsRepository,
    private readonly drizzle: DrizzleService,
  ) {}


  async promoteToPremium(listingId: number, userId: number, paymentId: number | null = null) {
    return this.drizzle.db.transaction((tx) =>
      this.promoteToPremiumInTransaction(tx, listingId, userId, paymentId),
    );
  }


  async promoteToPremiumInTransaction(
    tx: AppTransaction,
    listingId: number,
    userId: number,
    paymentId: number | null = null,
  ) {
    const listing = await this.listingsRepository.findOwnerAndTypeInTx(tx, listingId);
    if (!listing) {
      throw new NotFoundException('NOT_FOUND');
    }
    if (listing.userId !== userId) {
      throw new NotFoundException('NOT_FOUND');
    }

    if (listing.listingType === 'OFFER') {
      const deduction = await this.quotaService.checkAndDeductForFeaturedPublishTx(tx, userId);

      const row = await this.listingsRepository.publishAsPremiumInTx(
        tx,
        listingId,
        userId,
        paymentId,
        deduction.source === 'subscription' ? 'subscription' : 'credits',
      );
      if (!row) throw new NotFoundException('NOT_FOUND');

      return {
        success: true,
        promotedAs: 'featured_offer' as const,
        source: deduction.source,
        message:
          deduction.source === 'subscription'
            ? `Featured from your plan. ${deduction.remainingAfter.subscriptionQuota} left this month.`
            : `Featured using purchased credit. ${deduction.remainingAfter.purchasedCredits} credits left.`,
        remaining: deduction.remainingAfter,
      };
    }

    if (listing.listingType === 'REQUEST') {
      const deduction = await this.quotaService.checkAndDeductForSeriousRequestPublishTx(tx, userId);

      const row = await this.listingsRepository.publishAsPremiumInTx(
        tx,
        listingId,
        userId,
        paymentId,
        'credits',
      );
      if (!row) throw new NotFoundException('NOT_FOUND');

      return {
        success: true,
        promotedAs: 'serious_request' as const,
        source: deduction.source,
        remaining: deduction.remainingAfter,
      };
    }

    throw new BadRequestException('UNSUPPORTED_LISTING_TYPE');
  }

  /**
   * Called by the webhook fulfillment after a payment is confirmed.
   * Bypasses ownership check (payment already verified the user owns this listing).
   */
  async promoteToPremiumByPayment(listingId: number, paymentId: number) {
    const listing = await this.listingsRepository.findOwnerAndType(listingId);
    if (!listing) return null;

    await this.listingsRepository.publishAsPremium(listingId, null, paymentId, 'credits');
    return { listingId };
  }

  /**
   * Reveal (unlock) the contact details of a serious-request listing.
   * Burns one view from the subscriber's monthly quota.
   * Re-revealing an already-unlocked listing is free.
   */
  async revealSeriousRequest(listingId: number, viewerUserId: number): Promise<SeriousViewResult> {
    const listing = await this.listingsRepository.findOwnerAndType(listingId);
    if (!listing) {
      throw new NotFoundException('NOT_FOUND');
    }
    if (listing.listingType !== 'REQUEST') {
      throw new BadRequestException('NOT_A_REQUEST_LISTING');
    }

    return this.quotaService.checkAndDeductForSeriousRequestView(viewerUserId, listingId);
  }
}
