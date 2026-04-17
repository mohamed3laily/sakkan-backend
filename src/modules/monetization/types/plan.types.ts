export type PlanDto = {
  id: number;
  name: string;
  displayNameEn: string;
  displayNameAr: string;
  billingPeriod: 'monthly' | 'yearly';
  priceEgp: number;
  deviceLimit: number;
  seriousRequestViewsQuotaPerMonth: number;
  featuredAdViewsQuotaPerMonth: number;
  hasPriorityListing: boolean;
  hasVerifiedBadge: boolean;
  hasDedicatedSupport: boolean;
};
