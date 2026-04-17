import { ConflictException, Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';

import { DrizzleService } from '../../db/drizzle.service';
import { oneTimeCredits } from '../../db/schemas/monetization/one-time-credits';
import { quotaUsage } from '../../db/schemas/monetization/quota-usage';
import { subscriptionPlans } from '../../db/schemas/monetization/subscription-plans';
import { userSubscriptions } from '../../db/schemas/monetization/user-subscriptions';
import type { AppTransaction } from '../monetization-db.types';
import type { CreditType, DeductionResult, QuotaCheckResult } from '../types';

@Injectable()
export class QuotaService {
  constructor(private readonly drizzle: DrizzleService) {}

  async check(userId: number, type: CreditType): Promise<QuotaCheckResult> {
    const [subInfo, creditBalance] = await Promise.all([
      this.getSubscriptionInfo(userId, type),
      this.getCreditBalance(userId, type),
    ]);

    const subscriptionQuota = subInfo?.remaining ?? 0;
    const purchasedCredits = creditBalance;
    const totalAvailable = subscriptionQuota + purchasedCredits;

    if (totalAvailable > 0) {
      return {
        allowed: true,
        source: subscriptionQuota > 0 ? 'subscription' : 'credits',
        totalAvailable,
        breakdown: {
          subscriptionQuota,
          purchasedCredits,
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

  async checkAndDeduct(userId: number, type: CreditType): Promise<DeductionResult> {
    return this.drizzle.db.transaction(async (tx) => {
      const sub = await this.getActiveSubscriptionTx(tx, userId);

      if (sub) {
        const billingMonth = this.getCurrentBillingMonth(sub.periodStart, sub.periodEnd);
        const quotaLimit =
          type === 'featured'
            ? sub.plan.featuredAdQuotaPerMonth
            : sub.plan.seriousRequestViewsQuotaPerMonth;

        const usageRows = await tx
          .select()
          .from(quotaUsage)
          .where(and(eq(quotaUsage.userId, userId), eq(quotaUsage.billingMonth, billingMonth)))
          .for('update');

        const used = usageRows[0]
          ? type === 'featured'
            ? usageRows[0].featuredAdUsed
            : usageRows[0].seriousRequestUsed
          : 0;
        const limit = quotaLimit;

        if (used < limit) {
          const incrementFeatured =
            type === 'featured'
              ? { featuredAdUsed: sql`${quotaUsage.featuredAdUsed} + 1` }
              : { seriousRequestUsed: sql`${quotaUsage.seriousRequestUsed} + 1` };

          await tx
            .insert(quotaUsage)
            .values({
              userId,
              subscriptionId: sub.id,
              billingMonth,
              seriousRequestUsed: type === 'serious' ? 1 : 0,
              featuredAdUsed: type === 'featured' ? 1 : 0,
            })
            .onConflictDoUpdate({
              target: [quotaUsage.userId, quotaUsage.billingMonth],
              set: incrementFeatured,
            });

          const creditBalance = await this.getCreditBalanceTx(tx, userId, type);

          return {
            source: 'subscription' as const,
            remainingAfter: {
              subscriptionQuota: limit - used - 1,
              purchasedCredits: creditBalance,
            },
          };
        }
      }

      const creditRows = await tx
        .select()
        .from(oneTimeCredits)
        .where(and(eq(oneTimeCredits.userId, userId), eq(oneTimeCredits.type, type)))
        .for('update');

      const creditRow = creditRows[0];
      const available = creditRow ? creditRow.totalCredits - creditRow.usedCredits : 0;

      if (available > 0) {
        await tx
          .update(oneTimeCredits)
          .set({ usedCredits: sql`${oneTimeCredits.usedCredits} + 1` })
          .where(eq(oneTimeCredits.id, creditRow.id));

        const subRemaining = sub ? await this.getRemainingQuotaTx(tx, userId, type, sub) : 0;

        return {
          source: 'credits' as const,
          remainingAfter: {
            subscriptionQuota: subRemaining,
            purchasedCredits: available - 1,
          },
        };
      }

      throw new ConflictException('NO_QUOTA_OR_CREDITS');
    });
  }

  private async getSubscriptionInfo(userId: number, type: CreditType) {
    const sub = await this.getActiveSubscription(userId);
    if (!sub) return null;

    const billingMonth = this.getCurrentBillingMonth(sub.periodStart, sub.periodEnd);
    const usage = await this.drizzle.db
      .select()
      .from(quotaUsage)
      .where(and(eq(quotaUsage.userId, userId), eq(quotaUsage.billingMonth, billingMonth)))
      .limit(1);

    const used =
      type === 'featured' ? (usage[0]?.featuredAdUsed ?? 0) : (usage[0]?.seriousRequestUsed ?? 0);
    const total =
      type === 'featured'
        ? sub.plan.featuredAdQuotaPerMonth
        : sub.plan.seriousRequestViewsQuotaPerMonth;

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
      .select({
        sub: userSubscriptions,
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
    return { ...rows[0].sub, plan: rows[0].plan };
  }

  private async getActiveSubscriptionTx(tx: AppTransaction, userId: number) {
    const rows = await tx
      .select({
        sub: userSubscriptions,
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
    return { ...rows[0].sub, plan: rows[0].plan };
  }

  private async getCreditBalance(userId: number, type: CreditType): Promise<number> {
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
    type: CreditType,
  ): Promise<number> {
    const rows = await tx
      .select()
      .from(oneTimeCredits)
      .where(and(eq(oneTimeCredits.userId, userId), eq(oneTimeCredits.type, type)))
      .limit(1);

    if (!rows[0]) return 0;
    return Math.max(0, rows[0].totalCredits - rows[0].usedCredits);
  }

  private async getRemainingQuotaTx(
    tx: AppTransaction,
    userId: number,
    type: CreditType,
    sub: NonNullable<Awaited<ReturnType<QuotaService['getActiveSubscription']>>>,
  ): Promise<number> {
    const billingMonth = this.getCurrentBillingMonth(sub.periodStart, sub.periodEnd);
    const usage = await tx
      .select()
      .from(quotaUsage)
      .where(and(eq(quotaUsage.userId, userId), eq(quotaUsage.billingMonth, billingMonth)))
      .limit(1);

    const used =
      type === 'featured' ? (usage[0]?.featuredAdUsed ?? 0) : (usage[0]?.seriousRequestUsed ?? 0);
    const total =
      type === 'featured'
        ? sub.plan.featuredAdQuotaPerMonth
        : sub.plan.seriousRequestViewsQuotaPerMonth;

    return Math.max(0, total - used);
  }

  /**
   * Monthly quota window within the subscription period (anniversary months, UTC).
   */
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
