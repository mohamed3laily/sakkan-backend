import { subscriptionPlans } from '../../db/schemas/monetization/subscription-plans';
import { userSubscriptions } from '../../db/schemas/monetization/user-subscriptions';

export type FeaturedPublishResult = {
  source: 'subscription' | 'credits';
  remainingAfter: { subscriptionQuota: number; purchasedCredits: number };
};

export type SeriousPublishResult = {
  source: 'credits';
  remainingAfter: { purchasedCredits: number };
};

/**
 * Reveal-serious response: re-unlock is free, so `remainingViews` is only
 * meaningful after a fresh unlock consumed quota.
 */
export type SeriousViewResult =
  | { alreadyUnlocked: true }
  | { alreadyUnlocked: false; remainingViews: number };

export type FeaturedPublishCheck =
  | {
      allowed: true;
      source: 'subscription' | 'credits';
      totalAvailable: number;
      breakdown: { subscriptionQuota: number; purchasedCredits: number; resetDate: string | null };
    }
  | {
      allowed: false;
      reason: 'no_subscription_no_credits' | 'quota_exhausted';
      subscriptionInfo: {
        planNameEn: string;
        planNameAr: string;
        quotaTotal: number;
        quotaUsed: number;
        resetDate: string;
      } | null;
      creditsBalance: number;
    };

export type SeriousViewCheck =
  | { allowed: true; remainingViews: number; resetDate: string | null }
  | { allowed: false; reason: 'no_subscription' | 'view_quota_exhausted' };

export type ActiveSubscriptionForWalletQuotas = {
  subscription: typeof userSubscriptions.$inferSelect;
  plan: typeof subscriptionPlans.$inferSelect;
};

export type WalletSubscriptionQuotas = {
  billingMonth: string;
  featured: { limit: number; used: number; remaining: number };
};
