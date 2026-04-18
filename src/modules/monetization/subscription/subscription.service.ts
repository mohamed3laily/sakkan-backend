import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';

import { DrizzleService } from '../../db/drizzle.service';
import { subscriptionPlans } from '../../db/schemas/monetization/subscription-plans';
import { userSessions } from '../../db/schemas/monetization/user-sessions';
import { userSubscriptions } from '../../db/schemas/monetization/user-subscriptions';
import type { PlanDto } from '../types';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(private readonly drizzle: DrizzleService) {}

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
  }) {
    const plan = await this.getPlanById(params.planId);

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
      })
      .returning();

    this.logger.log(
      `Subscription activated: user=${params.userId} plan=${plan.name} until=${periodEnd.toISOString()}`,
    );

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

  async canLoginOnDevice(
    userId: number,
    deviceFingerprint: string,
  ): Promise<{ allowed: boolean; activeDevices: number; limit: number }> {
    const sub = await this.getActiveSubscription(userId);
    const limit = sub?.plan.deviceLimit ?? 1;

    const existing = await this.drizzle.db
      .select()
      .from(userSessions)
      .where(
        and(
          eq(userSessions.userId, userId),
          eq(userSessions.deviceFingerprint, deviceFingerprint),
          sql`${userSessions.revokedAt} IS NULL`,
        ),
      )
      .limit(1);

    if (existing[0]) {
      await this.drizzle.db
        .update(userSessions)
        .set({ lastSeenAt: new Date().toISOString() })
        .where(eq(userSessions.id, existing[0].id));

      return { allowed: true, activeDevices: 0, limit };
    }

    const activeSessions = await this.drizzle.db
      .select({ count: sql<number>`count(*)` })
      .from(userSessions)
      .where(and(eq(userSessions.userId, userId), sql`${userSessions.revokedAt} IS NULL`));

    const activeDevices = Number(activeSessions[0]?.count ?? 0);

    if (activeDevices >= limit) {
      return { allowed: false, activeDevices, limit };
    }

    await this.drizzle.db.insert(userSessions).values({
      userId,
      deviceFingerprint,
      lastSeenAt: new Date().toISOString(),
    });

    return { allowed: true, activeDevices: activeDevices + 1, limit };
  }

  async revokeDevice(userId: number, sessionId: number) {
    await this.drizzle.db
      .update(userSessions)
      .set({ revokedAt: new Date().toISOString() })
      .where(and(eq(userSessions.id, sessionId), eq(userSessions.userId, userId)));
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
    return this.drizzle.db
      .select()
      .from(userSessions)
      .where(and(eq(userSessions.userId, userId), sql`${userSessions.revokedAt} IS NULL`));
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
