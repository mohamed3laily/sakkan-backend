import { ConflictException, Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';

import { DrizzleService } from '../../db/drizzle.service';
import { oneTimeCredits } from '../../db/schemas/monetization/one-time-credits';
import { quotaUsage } from '../../db/schemas/monetization/quota-usage';
import { seriousRequestUnlocks } from '../../db/schemas/monetization/serious-request-unlocks';
import { subscriptionPlans } from '../../db/schemas/monetization/subscription-plans';
import { userSubscriptions } from '../../db/schemas/monetization/user-subscriptions';
import type { AppTransaction } from '../monetization-db.types';

export type FeaturedPublishResult = {
  source: 'subscription' | 'credits';
  remainingAfter: { subscriptionQuota: number; purchasedCredits: number };
};

export type SeriousPublishResult = {
  source: 'credits';
  remainingAfter: { purchasedCredits: number };
};

export type SeriousViewResult = {
  alreadyUnlocked: boolean;
  remainingViews: number;
};

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

@Injectable()
export class QuotaService {
  constructor(private readonly drizzle: DrizzleService) {}

  // ── Featured ad (OFFER) publish ──────────────────────────────────────────

  async checkFeaturedPublish(userId: number): Promise<FeaturedPublishCheck> {
    const [subInfo, creditBalance] = await Promise.all([
      this.getSubscriptionFeaturedInfo(userId),
      this.getCreditBalance(userId, 'featured'),
    ]);

    const subscriptionQuota = subInfo?.remaining ?? 0;
    const totalAvailable = subscriptionQuota + creditBalance;

    if (totalAvailable > 0) {
      return {
        allowed: true,
        source: subscriptionQuota > 0 ? 'subscription' : 'credits',
        totalAvailable,
        breakdown: {
          subscriptionQuota,
          purchasedCredits: creditBalance,
          resetDate: subInfo?.resetDate ?? null,
        },
      };
    }

    if (!subInfo) {
      return {
        allowed: false,
        reason: 'no_subscription_no_credits',
        subscriptionInfo: null,
        creditsBalance: 0,
      };
    }

    return {
      allowed: false,
      reason: 'quota_exhausted',
      subscriptionInfo: {
        planNameEn: subInfo.planNameEn,
        planNameAr: subInfo.planNameAr,
        quotaTotal: subInfo.total,
        quotaUsed: subInfo.used,
        resetDate: subInfo.resetDate,
      },
      creditsBalance: 0,
    };
  }

  async checkAndDeductForFeaturedPublish(userId: number): Promise<FeaturedPublishResult> {
    return this.drizzle.db.transaction(async (tx) => {
      return this.checkAndDeductForFeaturedPublishTx(tx, userId);
    });
  }

  async checkAndDeductForFeaturedPublishTx(
    tx: AppTransaction,
    userId: number,
  ): Promise<FeaturedPublishResult> {
    const sub = await this.getActiveSubscriptionTx(tx, userId);

    if (sub) {
      const billingMonth = this.getCurrentBillingMonth(sub.periodStart, sub.periodEnd);
      const quotaLimit = sub.plan.featuredAdQuotaPerMonth;

      const usageRows = await tx
        .select()
        .from(quotaUsage)
        .where(and(eq(quotaUsage.userId, userId), eq(quotaUsage.billingMonth, billingMonth)))
        .for('update');

      const used = usageRows[0]?.featuredAdUsed ?? 0;

      if (used < quotaLimit) {
        await tx
          .insert(quotaUsage)
          .values({
            userId,
            subscriptionId: sub.id,
            billingMonth,
            seriousRequestViewsUsed: 0,
            featuredAdUsed: 1,
          })
          .onConflictDoUpdate({
            target: [quotaUsage.userId, quotaUsage.billingMonth],
            set: { featuredAdUsed: sql`${quotaUsage.featuredAdUsed} + 1` },
          });

        const creditBalance = await this.getCreditBalanceTx(tx, userId, 'featured');

        return {
          source: 'subscription' as const,
          remainingAfter: {
            subscriptionQuota: quotaLimit - used - 1,
            purchasedCredits: creditBalance,
          },
        };
      }
    }

    const creditRows = await tx
      .select()
      .from(oneTimeCredits)
      .where(and(eq(oneTimeCredits.userId, userId), eq(oneTimeCredits.type, 'featured')))
      .for('update');

    const creditRow = creditRows[0];
    const available = creditRow ? creditRow.totalCredits - creditRow.usedCredits : 0;

    if (available > 0) {
      await tx
        .update(oneTimeCredits)
        .set({ usedCredits: sql`${oneTimeCredits.usedCredits} + 1` })
        .where(eq(oneTimeCredits.id, creditRow.id));

      const subRemaining = sub ? await this.getRemainingFeaturedQuotaTx(tx, userId, sub) : 0;

      return {
        source: 'credits' as const,
        remainingAfter: {
          subscriptionQuota: subRemaining,
          purchasedCredits: available - 1,
        },
      };
    }

    throw new ConflictException('NO_QUOTA_OR_CREDITS');
  }

  // ── Serious request (REQUEST) publish ────────────────────────────────────
  // Credits only — no subscription quota gates publishing.

  async checkAndDeductForSeriousRequestPublish(userId: number): Promise<SeriousPublishResult> {
    return this.drizzle.db.transaction(async (tx) => {
      return this.checkAndDeductForSeriousRequestPublishTx(tx, userId);
    });
  }

  /** Use inside an outer transaction (e.g. create listing + premium in one commit). */
  async checkAndDeductForSeriousRequestPublishTx(
    tx: AppTransaction,
    userId: number,
  ): Promise<SeriousPublishResult> {
    const creditRows = await tx
      .select()
      .from(oneTimeCredits)
      .where(and(eq(oneTimeCredits.userId, userId), eq(oneTimeCredits.type, 'serious')))
      .for('update');

    const creditRow = creditRows[0];
    const available = creditRow ? creditRow.totalCredits - creditRow.usedCredits : 0;

    if (available <= 0) {
      throw new ConflictException('NO_CREDITS');
    }

    await tx
      .update(oneTimeCredits)
      .set({ usedCredits: sql`${oneTimeCredits.usedCredits} + 1` })
      .where(eq(oneTimeCredits.id, creditRow.id));

    return {
      source: 'credits' as const,
      remainingAfter: { purchasedCredits: available - 1 },
    };
  }

  // ── Serious request view (reveal contact details) ────────────────────────
  // Subscription quota only. Re-viewing an already-unlocked listing is free.

  async checkSeriousRequestView(userId: number): Promise<SeriousViewCheck> {
    const sub = await this.getActiveSubscription(userId);
    if (!sub) {
      return { allowed: false, reason: 'no_subscription' };
    }

    const billingMonth = this.getCurrentBillingMonth(sub.periodStart, sub.periodEnd);
    const usage = await this.drizzle.db
      .select()
      .from(quotaUsage)
      .where(and(eq(quotaUsage.userId, userId), eq(quotaUsage.billingMonth, billingMonth)))
      .limit(1);

    const used = usage[0]?.seriousRequestViewsUsed ?? 0;
    const total = sub.plan.seriousRequestViewsQuotaPerMonth;
    const remaining = Math.max(0, total - used);

    if (remaining > 0) {
      const periodEnd = sub.periodEnd instanceof Date ? sub.periodEnd : new Date(sub.periodEnd);
      return { allowed: true, remainingViews: remaining, resetDate: periodEnd.toISOString() };
    }

    return { allowed: false, reason: 'view_quota_exhausted' };
  }

  async checkAndDeductForSeriousRequestView(
    userId: number,
    listingId: number,
  ): Promise<SeriousViewResult> {
    return this.drizzle.db.transaction(async (tx) => {
      // Re-viewing an already-unlocked listing is free.
      const existing = await tx
        .select()
        .from(seriousRequestUnlocks)
        .where(
          and(
            eq(seriousRequestUnlocks.userId, userId),
            eq(seriousRequestUnlocks.listingId, listingId),
          ),
        )
        .limit(1);

      if (existing[0]) {
        const remaining = await this.getRemainingViewQuotaTx(tx, userId);
        return { alreadyUnlocked: true, remainingViews: remaining };
      }

      const sub = await this.getActiveSubscriptionTx(tx, userId);
      if (!sub) {
        throw new ConflictException('NO_SUBSCRIPTION');
      }

      const billingMonth = this.getCurrentBillingMonth(sub.periodStart, sub.periodEnd);
      const usageRows = await tx
        .select()
        .from(quotaUsage)
        .where(and(eq(quotaUsage.userId, userId), eq(quotaUsage.billingMonth, billingMonth)))
        .for('update');

      const used = usageRows[0]?.seriousRequestViewsUsed ?? 0;
      const quotaLimit = sub.plan.seriousRequestViewsQuotaPerMonth;

      if (used >= quotaLimit) {
        throw new ConflictException('VIEW_QUOTA_EXHAUSTED');
      }

      await tx
        .insert(quotaUsage)
        .values({
          userId,
          subscriptionId: sub.id,
          billingMonth,
          seriousRequestViewsUsed: 1,
          featuredAdUsed: 0,
        })
        .onConflictDoUpdate({
          target: [quotaUsage.userId, quotaUsage.billingMonth],
          set: {
            seriousRequestViewsUsed: sql`${quotaUsage.seriousRequestViewsUsed} + 1`,
          },
        });

      await tx.insert(seriousRequestUnlocks).values({ userId, listingId });

      return { alreadyUnlocked: false, remainingViews: quotaLimit - used - 1 };
    });
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private async getSubscriptionFeaturedInfo(userId: number) {
    const sub = await this.getActiveSubscription(userId);
    if (!sub) return null;

    const billingMonth = this.getCurrentBillingMonth(sub.periodStart, sub.periodEnd);
    const usage = await this.drizzle.db
      .select()
      .from(quotaUsage)
      .where(and(eq(quotaUsage.userId, userId), eq(quotaUsage.billingMonth, billingMonth)))
      .limit(1);

    const used = usage[0]?.featuredAdUsed ?? 0;
    const total = sub.plan.featuredAdQuotaPerMonth;
    const periodEnd = sub.periodEnd instanceof Date ? sub.periodEnd : new Date(sub.periodEnd);

    return {
      planNameEn: sub.plan.displayNameEn,
      planNameAr: sub.plan.displayNameAr,
      total,
      used,
      remaining: Math.max(0, total - used),
      resetDate: periodEnd.toISOString(),
    };
  }

  private async getActiveSubscription(userId: number) {
    const rows = await this.drizzle.db
      .select({ sub: userSubscriptions, plan: subscriptionPlans })
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
    return { ...rows[0].sub, plan: rows[0].plan };
  }

  private async getActiveSubscriptionTx(tx: AppTransaction, userId: number) {
    const rows = await tx
      .select({ sub: userSubscriptions, plan: subscriptionPlans })
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
    return { ...rows[0].sub, plan: rows[0].plan };
  }

  private async getCreditBalance(userId: number, type: 'serious' | 'featured'): Promise<number> {
    const rows = await this.drizzle.db
      .select()
      .from(oneTimeCredits)
      .where(and(eq(oneTimeCredits.userId, userId), eq(oneTimeCredits.type, type)))
      .limit(1);

    if (!rows[0]) return 0;
    return Math.max(0, rows[0].totalCredits - rows[0].usedCredits);
  }

  private async getCreditBalanceTx(
    tx: AppTransaction,
    userId: number,
    type: 'serious' | 'featured',
  ): Promise<number> {
    const rows = await tx
      .select()
      .from(oneTimeCredits)
      .where(and(eq(oneTimeCredits.userId, userId), eq(oneTimeCredits.type, type)))
      .limit(1);

    if (!rows[0]) return 0;
    return Math.max(0, rows[0].totalCredits - rows[0].usedCredits);
  }

  private async getRemainingFeaturedQuotaTx(
    tx: AppTransaction,
    userId: number,
    sub: NonNullable<Awaited<ReturnType<QuotaService['getActiveSubscription']>>>,
  ): Promise<number> {
    const billingMonth = this.getCurrentBillingMonth(sub.periodStart, sub.periodEnd);
    const usage = await tx
      .select()
      .from(quotaUsage)
      .where(and(eq(quotaUsage.userId, userId), eq(quotaUsage.billingMonth, billingMonth)))
      .limit(1);

    const used = usage[0]?.featuredAdUsed ?? 0;
    return Math.max(0, sub.plan.featuredAdQuotaPerMonth - used);
  }

  private async getRemainingViewQuotaTx(tx: AppTransaction, userId: number): Promise<number> {
    const sub = await this.getActiveSubscriptionTx(tx, userId);
    if (!sub) return 0;

    const billingMonth = this.getCurrentBillingMonth(sub.periodStart, sub.periodEnd);
    const usage = await tx
      .select()
      .from(quotaUsage)
      .where(and(eq(quotaUsage.userId, userId), eq(quotaUsage.billingMonth, billingMonth)))
      .limit(1);

    const used = usage[0]?.seriousRequestViewsUsed ?? 0;
    return Math.max(0, sub.plan.seriousRequestViewsQuotaPerMonth - used);
  }

  private getCurrentBillingMonth(periodStart: Date | string, periodEnd: Date | string): string {
    const start = periodStart instanceof Date ? periodStart : new Date(periodStart);
    const end = periodEnd instanceof Date ? periodEnd : new Date(periodEnd);
    const now = new Date();
    if (now < start) {
      return this.formatYearMonth(start);
    }

    let anchor = new Date(start);
    while (true) {
      const next = new Date(anchor);
      next.setUTCMonth(next.getUTCMonth() + 1);
      if (next > now || next > end) {
        break;
      }
      anchor = next;
    }
    return this.formatYearMonth(anchor);
  }

  private formatYearMonth(d: Date): string {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }
}
