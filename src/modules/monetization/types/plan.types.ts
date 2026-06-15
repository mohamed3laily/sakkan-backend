import { subscriptionPlans } from '../../db/schemas/monetization/subscription-plans';

export const PLAN_DTO_SELECT = {
  id: subscriptionPlans.id,
  name: subscriptionPlans.name,
  displayNameEn: subscriptionPlans.displayNameEn,
  displayNameAr: subscriptionPlans.displayNameAr,
  billingPeriod: subscriptionPlans.billingPeriod,
  priceEgp: subscriptionPlans.priceEgp,
  deviceLimit: subscriptionPlans.deviceLimit,
  seriousRequestViewsQuotaPerMonth: subscriptionPlans.seriousRequestViewsQuotaPerMonth,
  featuredAdViewsQuotaPerMonth: subscriptionPlans.featuredAdQuotaPerMonth,
  appleProductId: subscriptionPlans.appleProductId,
  hasPriorityListing: subscriptionPlans.hasPriorityListing,
  hasVerifiedBadge: subscriptionPlans.hasVerifiedBadge,
  hasDedicatedSupport: subscriptionPlans.hasDedicatedSupport,
} as const;

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
  appleProductId: string | null;
  hasPriorityListing: boolean;
  hasVerifiedBadge: boolean;
  hasDedicatedSupport: boolean;
};

export type SubscriptionPlanRow = typeof subscriptionPlans.$inferSelect;

/** Frozen plan terms at purchase time (plus plan id). */
export type SubscriptionPlanSnapshot = {
  planId: number;
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

export function toPlanSnapshot(plan: SubscriptionPlanRow): SubscriptionPlanSnapshot {
  return {
    planId: plan.id,
    name: plan.name,
    displayNameEn: plan.displayNameEn,
    displayNameAr: plan.displayNameAr,
    billingPeriod: plan.billingPeriod,
    priceEgp: plan.priceEgp,
    deviceLimit: plan.deviceLimit,
    seriousRequestViewsQuotaPerMonth: plan.seriousRequestViewsQuotaPerMonth,
    featuredAdViewsQuotaPerMonth: plan.featuredAdQuotaPerMonth,
    hasPriorityListing: plan.hasPriorityListing,
    hasVerifiedBadge: plan.hasVerifiedBadge,
    hasDedicatedSupport: plan.hasDedicatedSupport,
  };
}
