import { Injectable } from '@nestjs/common';

import { DrizzleService } from '../drizzle.service';
import { subscriptionPlans } from '../schemas/monetization/subscription-plans';
import { userSubscriptions } from '../schemas/monetization/user-subscriptions';

@Injectable()
export class SubscriptionPlansSeed {
  constructor(private readonly drizzle: DrizzleService) {}

  async run() {
    const db = this.drizzle.db;

    console.log('Seeding subscription plans...');

    await db.delete(subscriptionPlans);

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

    console.log('Subscription plans seeded');
  }
}
