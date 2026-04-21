import { Injectable } from '@nestjs/common';

import { CreditsService } from '../credits/credits.service';
import { QuotaService } from '../quota/quota.service';
import { SubscriptionService } from './subscription.service';

@Injectable()
export class SubscriptionWalletService {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly creditsService: CreditsService,
    private readonly quotaService: QuotaService,
  ) {}

  async getWalletOverview(userId: number) {
    const [sub, balances, featuredCheck, seriousViewCheck] = await Promise.all([
      this.subscriptionService.getActiveSubscription(userId),
      this.creditsService.getAllBalances(userId),
      this.quotaService.checkFeaturedPublish(userId),
      this.quotaService.checkSeriousRequestView(userId),
    ]);

    return {
      subscription: sub
        ? {
            planNameEn: sub.plan.displayNameEn,
            planNameAr: sub.plan.displayNameAr,
            status: sub.subscription.status,
            periodEnd: sub.subscription.periodEnd,
            deviceLimit: sub.plan.deviceLimit,
          }
        : null,
      credits: balances,
      featuredPublish: featuredCheck,
      seriousRequestView: seriousViewCheck,
    };
  }
}
