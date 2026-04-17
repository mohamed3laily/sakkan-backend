import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { ListingsRepository } from '../../listing/listing.repo';
import type { CreditType, QuotaCheckResult } from '../types';
import { QuotaService } from '../quota/quota.service';

@Injectable()
export class ListingPromotionService {
  constructor(
    private readonly quotaService: QuotaService,
    private readonly listingsRepository: ListingsRepository,
  ) {}

  checkQuota(userId: number, type: CreditType): Promise<QuotaCheckResult> {
    return this.quotaService.check(userId, type);
  }

  parseCreditTypeParam(type: string): CreditType {
    if (type === 'serious' || type === 'featured') {
      return type;
    }
    throw new BadRequestException('VALIDATION_ERROR');
  }

  async makeFeatured(userId: number, listingId: number) {
    await this.assertListingOwner(listingId, userId);

    const deduction = await this.quotaService.checkAndDeduct(userId, 'featured');

    const row = await this.listingsRepository.publishAsFeatured(
      listingId,
      userId,
      null,
      deduction.source === 'subscription' ? 'subscription' : 'credits',
    );
    if (!row) {
      throw new NotFoundException('NOT_FOUND');
    }

    return {
      success: true,
      source: deduction.source,
      message:
        deduction.source === 'subscription'
          ? `Featured from your plan. ${deduction.remainingAfter.subscriptionQuota} left this month.`
          : `Featured using purchased credit. ${deduction.remainingAfter.purchasedCredits} credits left.`,
      remaining: {
        total:
          deduction.remainingAfter.subscriptionQuota + deduction.remainingAfter.purchasedCredits,
        breakdown: deduction.remainingAfter,
      },
    };
  }

  async makeSerious(userId: number, listingId: number) {
    await this.assertListingOwner(listingId, userId);

    const deduction = await this.quotaService.checkAndDeduct(userId, 'serious');

    const row = await this.listingsRepository.publishAsSerious(
      listingId,
      userId,
      null,
      deduction.source === 'subscription' ? 'subscription' : 'credits',
    );
    if (!row) {
      throw new NotFoundException('NOT_FOUND');
    }

    return {
      success: true,
      source: deduction.source,
      remaining: deduction.remainingAfter,
    };
  }

  private async assertListingOwner(listingId: number, userId: number) {
    const ownerId = await this.listingsRepository.findOwnerId(listingId);
    if (ownerId !== userId) {
      throw new NotFoundException('NOT_FOUND');
    }
  }
}
