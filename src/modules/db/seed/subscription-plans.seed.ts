import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { DrizzleService } from '../drizzle.service';
import { subscriptionPlans } from '../schemas/monetization/subscription-plans';

const APPLE_BUNDLE_PREFIX = 'com.sakanapp.ios';

const APPLE_PRODUCT_IDS = [
  { name: 'basic', billingPeriod: 'monthly' as const, suffix: 'basic_monthly' },
  { name: 'professional', billingPeriod: 'monthly' as const, suffix: 'professional_monthly' },
  { name: 'gold', billingPeriod: 'monthly' as const, suffix: 'gold_monthly' },
  { name: 'professional', billingPeriod: 'yearly' as const, suffix: 'professional_yearly' },
  { name: 'gold', billingPeriod: 'yearly' as const, suffix: 'gold_yearly' },
];

@Injectable()
export class SubscriptionPlansSeed {
  constructor(private readonly drizzle: DrizzleService) {}

  async run() {
    const db = this.drizzle.db;

    console.log('Seeding subscription plans...');

    await db.insert(subscriptionPlans).values([
      {
        name: 'basic',
        displayNameEn: 'Basic Plan',
        displayNameAr: 'الخطة العادية',
        billingPeriod: 'monthly',
        priceEgp: 999,
        deviceLimit: 1,
        seriousRequestViewsQuotaPerMonth: 2,
        featuredAdQuotaPerMonth: 0,
        hasPriorityListing: false,
        hasVerifiedBadge: false,
        hasDedicatedSupport: false,
        isActive: true,
        sortOrder: 1,
      },
      {
        name: 'professional',
        displayNameEn: 'Professional Plan',
        displayNameAr: 'الخطة المتميزة',
        billingPeriod: 'monthly',
        priceEgp: 1999,
        deviceLimit: 2,
        seriousRequestViewsQuotaPerMonth: 4,
        featuredAdQuotaPerMonth: 10,
        hasPriorityListing: false,
        hasVerifiedBadge: false,
        hasDedicatedSupport: false,
        isActive: true,
        sortOrder: 2,
      },
      {
        name: 'gold',
        displayNameEn: 'Gold Plan',
        displayNameAr: 'الخطة الذهبية',
        billingPeriod: 'monthly',
        priceEgp: 4999,
        deviceLimit: 4,
        seriousRequestViewsQuotaPerMonth: 8,
        featuredAdQuotaPerMonth: 25,
        hasPriorityListing: false,
        hasVerifiedBadge: false,
        hasDedicatedSupport: false,
        isActive: true,
        sortOrder: 3,
      },
      {
        name: 'professional',
        displayNameEn: 'Professional — Yearly',
        displayNameAr: 'متميز — سنوي',
        billingPeriod: 'yearly',
        priceEgp: 18999,
        deviceLimit: 2,
        seriousRequestViewsQuotaPerMonth: 4,
        featuredAdQuotaPerMonth: 12,
        hasPriorityListing: true,
        hasVerifiedBadge: false,
        hasDedicatedSupport: false,
        isActive: true,
        sortOrder: 4,
      },
      {
        name: 'gold',
        displayNameEn: 'Gold — Yearly',
        displayNameAr: 'ذهبي — سنوي',
        billingPeriod: 'yearly',
        priceEgp: 44999,
        deviceLimit: 4,
        seriousRequestViewsQuotaPerMonth: 8,
        featuredAdQuotaPerMonth: 25,
        hasPriorityListing: true,
        hasVerifiedBadge: true,
        hasDedicatedSupport: true,
        isActive: true,
        sortOrder: 5,
      },
    ]);

    for (const { name, billingPeriod, suffix } of APPLE_PRODUCT_IDS) {
      await db
        .update(subscriptionPlans)
        .set({ appleProductId: `${APPLE_BUNDLE_PREFIX}.${suffix}` })
        .where(
          and(eq(subscriptionPlans.name, name), eq(subscriptionPlans.billingPeriod, billingPeriod)),
        );
    }

    console.log('Subscription plans seeded');
  }
}
