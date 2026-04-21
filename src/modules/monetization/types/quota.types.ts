export type CreditType = 'serious' | 'featured';
export type ListingTier = 'standard' | 'premium';
export type QuotaSource = 'subscription' | 'credits' | 'free';

export type DeductionResult = {
  source: QuotaSource;
  remainingAfter: {
    subscriptionQuota: number;
    purchasedCredits: number;
  };
};
