export type CreditType = 'serious' | 'featured';
export type ListingTier = 'regular' | 'serious' | 'featured';
export type QuotaSource = 'subscription' | 'credits' | 'free';

export type QuotaCheckAllowed = {
  allowed: true;
  source: QuotaSource;
  totalAvailable: number;
  breakdown: {
    subscriptionQuota: number;
    purchasedCredits: number;
    resetDate: string | null;
  };
};

export type QuotaCheckBlocked = {
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

export type QuotaCheckResult = QuotaCheckAllowed | QuotaCheckBlocked;

export type DeductionResult = {
  source: QuotaSource;
  remainingAfter: {
    subscriptionQuota: number;
    purchasedCredits: number;
  };
};
