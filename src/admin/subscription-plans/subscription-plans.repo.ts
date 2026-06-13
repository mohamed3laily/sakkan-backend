import { Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';

import { DrizzleService } from 'src/modules/db/drizzle.service';
import { subscriptionPlans } from 'src/modules/db/schemas/monetization/subscription-plans';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';

const PLAN_COLUMNS = {
  id: subscriptionPlans.id,
  name: subscriptionPlans.name,
  displayNameEn: subscriptionPlans.displayNameEn,
  displayNameAr: subscriptionPlans.displayNameAr,
  billingPeriod: subscriptionPlans.billingPeriod,
  priceEgp: subscriptionPlans.priceEgp,
  deviceLimit: subscriptionPlans.deviceLimit,
  seriousRequestViewsQuotaPerMonth: subscriptionPlans.seriousRequestViewsQuotaPerMonth,
  featuredAdQuotaPerMonth: subscriptionPlans.featuredAdQuotaPerMonth,
  hasPriorityListing: subscriptionPlans.hasPriorityListing,
  hasVerifiedBadge: subscriptionPlans.hasVerifiedBadge,
  hasDedicatedSupport: subscriptionPlans.hasDedicatedSupport,
  isActive: subscriptionPlans.isActive,
  appleProductId: subscriptionPlans.appleProductId,
  sortOrder: subscriptionPlans.sortOrder,
  createdAt: subscriptionPlans.createdAt,
  updatedAt: subscriptionPlans.updatedAt,
} as const;

@Injectable()
export class SubscriptionPlansRepo {
  constructor(private readonly drizzleService: DrizzleService) {}

  async findAll() {
    const rows = await this.drizzleService.db
      .select(PLAN_COLUMNS)
      .from(subscriptionPlans)
      .orderBy(asc(subscriptionPlans.sortOrder));

    return rows.map((row) => this.toAdminPlan(row));
  }

  async findById(id: number) {
    const [row] = await this.drizzleService.db
      .select(PLAN_COLUMNS)
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, id))
      .limit(1);

    return row ? this.toAdminPlan(row) : null;
  }

  async update(id: number, dto: UpdateSubscriptionPlanDto) {
    const [updated] = await this.drizzleService.db
      .update(subscriptionPlans)
      .set(dto)
      .where(eq(subscriptionPlans.id, id))
      .returning(PLAN_COLUMNS);

    return updated ? this.toAdminPlan(updated) : null;
  }

  private toAdminPlan(row: {
    id: number;
    name: string;
    displayNameEn: string;
    displayNameAr: string;
    billingPeriod: 'monthly' | 'yearly';
    priceEgp: number;
    deviceLimit: number;
    seriousRequestViewsQuotaPerMonth: number;
    featuredAdQuotaPerMonth: number;
    hasPriorityListing: boolean;
    hasVerifiedBadge: boolean;
    hasDedicatedSupport: boolean;
    isActive: boolean;
    sortOrder: number;
    createdAt: Date | string;
    updatedAt: Date | string | null;
  }) {
    return {
      id: row.id,
      name: row.name,
      displayNameEn: row.displayNameEn,
      displayNameAr: row.displayNameAr,
      billingPeriod: row.billingPeriod,
      priceEgp: row.priceEgp,
      deviceLimit: row.deviceLimit,
      seriousRequestViewsQuotaPerMonth: row.seriousRequestViewsQuotaPerMonth,
      featuredAdViewsQuotaPerMonth: row.featuredAdQuotaPerMonth,
      hasPriorityListing: row.hasPriorityListing,
      hasVerifiedBadge: row.hasVerifiedBadge,
      hasDedicatedSupport: row.hasDedicatedSupport,
      isActive: row.isActive,
      sortOrder: row.sortOrder,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
