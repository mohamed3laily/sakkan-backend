import { Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';

import { DrizzleService } from '../../db/drizzle.service';
import { subscriptionPlans } from '../../db/schemas/monetization/subscription-plans';
import { userSubscriptions } from '../../db/schemas/monetization/user-subscriptions';
import { toPlanSnapshot, type PlanDto } from '../types';
import { UserSessionService } from '../../auth/user-session.service';

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly userSessionService: UserSessionService,
  ) {}

  async getActivePlans(): Promise<PlanDto[]> {
    const plans = await this.drizzle.db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, true))
      .orderBy(subscriptionPlans.sortOrder);

    return plans.map((p) => ({
      id: p.id,
      name: p.name,
      displayNameEn: p.displayNameEn,
      displayNameAr: p.displayNameAr,
      billingPeriod: p.billingPeriod,
      priceEgp: p.priceEgp,
      deviceLimit: p.deviceLimit,
      seriousRequestViewsQuotaPerMonth: p.seriousRequestViewsQuotaPerMonth,
      featuredAdViewsQuotaPerMonth: p.featuredAdQuotaPerMonth,
      hasPriorityListing: p.hasPriorityListing,
      hasVerifiedBadge: p.hasVerifiedBadge,
      hasDedicatedSupport: p.hasDedicatedSupport,
    }));
  }

  async getPlanById(planId: number) {
    const rows = await this.drizzle.db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, planId))
      .limit(1);

    if (!rows[0]) throw new NotFoundException('NOT_FOUND');
    return rows[0];
  }

  async activateSubscription(params: {
    userId: number;
    planId: number;
    paymentId: number;
    paymobOrderId: string;
    paidAmountPiasters: number;
  }) {
    const plan = await this.getPlanById(params.planId);
    const planSnapshot = toPlanSnapshot(plan);
    const paidEgp = Math.floor(params.paidAmountPiasters / 100);

    await this.drizzle.db
      .update(userSubscriptions)
      .set({
        status: 'cancelled',
        cancelledAt: new Date(),
        cancellationReason: 'Replaced by new subscription',
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(eq(userSubscriptions.userId, params.userId), eq(userSubscriptions.status, 'active')),
      );

    const now = new Date();
    const periodEnd = this.computePeriodEnd(now, plan.billingPeriod);

    const [subscription] = await this.drizzle.db
      .insert(userSubscriptions)
      .values({
        userId: params.userId,
        planId: params.planId,
        status: 'active',
        periodStart: now,
        periodEnd,
        autoRenew: true,
        paymobOrderId: params.paymobOrderId,
        paidEgp,
        planSnapshot,
      })
      .returning();

    return subscription;
  }

  async getActiveSubscription(userId: number) {
    const rows = await this.drizzle.db
      .select({
        subscription: userSubscriptions,
        plan: subscriptionPlans,
      })
      .from(userSubscriptions)
      .innerJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
      .where(
        and(
          eq(userSubscriptions.userId, userId),
          eq(userSubscriptions.status, 'active'),
          sql`${userSubscriptions.periodEnd} > NOW()`,
        ),
      )
      .limit(1);

    if (!rows[0]) return null;
    return {
      subscription: rows[0].subscription,
      plan: rows[0].plan,
    };
  }

  async getDeviceLimit(userId: number): Promise<number> {
    return this.userSessionService.getDeviceLimit(userId);
  }

  async revokeDevice(userId: number, sessionId: number) {
    await this.userSessionService.revokeSession(sessionId, 'manual_revoke', userId);
  }

  /**
   * Remove all subscription rows for this user (including history). Intended for local/staging
   * testing only; `quota_usage` rows for those subscriptions are cascade-deleted.
   */
  async deleteAllSubscriptionsForTesting(userId: number): Promise<{ removed: number }> {
    const deleted = await this.drizzle.db
      .delete(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId))
      .returning({ id: userSubscriptions.id });

    return { removed: deleted.length };
  }

  getActiveDevices(userId: number) {
    return this.userSessionService.getActiveDevices(userId);
  }

  private computePeriodEnd(from: Date, billingPeriod: string): Date {
    const end = new Date(from);
    if (billingPeriod === 'yearly') {
      end.setUTCFullYear(end.getUTCFullYear() + 1);
    } else {
      end.setUTCMonth(end.getUTCMonth() + 1);
    }
    return end;
  }

  computePriorityScore(plan: {
    name: string;
    billingPeriod: string;
    hasPriorityListing: boolean;
  }): number {
    if (!plan.hasPriorityListing) return 0;
    if (plan.billingPeriod === 'yearly') {
      return plan.name.toLowerCase().includes('gold') ? 100 : 75;
    }
    return plan.name.toLowerCase().includes('gold') ? 50 : 25;
  }
}
