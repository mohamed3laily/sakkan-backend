import { Injectable } from '@nestjs/common';
import { and, count, eq, ilike, or, sql } from 'drizzle-orm';

import { DrizzleService } from 'src/modules/db/drizzle.service';
import { subscriptionPlans } from 'src/modules/db/schemas/monetization/subscription-plans';
import { userSubscriptions } from 'src/modules/db/schemas/monetization/user-subscriptions';
import { users } from 'src/modules/db/schemas/user/user';
import { AdminUserSubscriptionQueryDto } from './dto/user-subscription-query.dto';

const ACTIVE_CONDITION = and(
  eq(userSubscriptions.status, 'active'),
  sql`${userSubscriptions.periodEnd} > NOW()`,
);

type SubscriptionListRow = {
  id: number;
  userId: number;
  userFirstName: string;
  userLastName: string;
  userPhone: string;
  planId: number;
  planDisplayNameEn: string;
  planDisplayNameAr: string;
  periodStart: Date | string;
  periodEnd: Date | string;
  paidEgp: number | null;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  displayStatus: 'active' | 'expired';
};

type SubscriptionDetailRow = SubscriptionListRow & {
  autoRenew: boolean;
  paymobOrderId: string | null;
  paymobSubscriptionId: string | null;
  cancelledAt: Date | string | null;
  cancellationReason: string | null;
  planSnapshot: unknown;
  createdAt: Date | string;
  updatedAt: Date | string | null;
};

@Injectable()
export class UserSubscriptionsRepo {
  constructor(private readonly drizzleService: DrizzleService) {}

  async getInsights() {
    const [[{ totalSubscriptions }], [{ activeSubscriptions }], [{ currentRevenue }]] =
      await Promise.all([
        this.drizzleService.db.select({ totalSubscriptions: count() }).from(userSubscriptions),
        this.drizzleService.db
          .select({ activeSubscriptions: count() })
          .from(userSubscriptions)
          .where(ACTIVE_CONDITION),
        this.drizzleService.db
          .select({
            currentRevenue: sql<number>`COALESCE(SUM(COALESCE(${userSubscriptions.paidEgp}, (${userSubscriptions.planSnapshot}->>'priceEgp')::int, 0)), 0)`,
          })
          .from(userSubscriptions)
          .where(ACTIVE_CONDITION),
      ]);

    return {
      totalSubscriptions: Number(totalSubscriptions),
      activeSubscriptions: Number(activeSubscriptions),
      currentRevenue: Number(currentRevenue),
    };
  }

  async findAll(query: AdminUserSubscriptionQueryDto) {
    const { page = 1, limit = 10, search } = query;
    const offset = (page - 1) * limit;
    const whereClause = search ? this.buildSearchWhere(search) : undefined;

    const [data, [{ total }]] = await Promise.all([
      this.drizzleService.db
        .select(this.listSelect())
        .from(userSubscriptions)
        .innerJoin(users, eq(userSubscriptions.userId, users.id))
        .innerJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
        .where(whereClause)
        .orderBy(sql`${userSubscriptions.createdAt} DESC`)
        .limit(limit)
        .offset(offset),
      this.drizzleService.db
        .select({ total: count() })
        .from(userSubscriptions)
        .innerJoin(users, eq(userSubscriptions.userId, users.id))
        .innerJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
        .where(whereClause),
    ]);

    return { data: data.map((row) => this.toListItem(row)), total: Number(total) };
  }

  async findById(id: number) {
    const [row] = await this.drizzleService.db
      .select(this.detailSelect())
      .from(userSubscriptions)
      .innerJoin(users, eq(userSubscriptions.userId, users.id))
      .innerJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
      .where(eq(userSubscriptions.id, id))
      .limit(1);

    return row ? this.toDetail(row) : null;
  }

  async findRowById(id: number) {
    const [row] = await this.drizzleService.db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.id, id))
      .limit(1);

    return row ?? null;
  }

  async cancel(id: number) {
    const now = new Date();
    const [updated] = await this.drizzleService.db
      .update(userSubscriptions)
      .set({
        status: 'cancelled',
        cancelledAt: now,
        cancellationReason: 'Cancelled by admin',
        autoRenew: false,
        updatedAt: now.toISOString(),
      })
      .where(eq(userSubscriptions.id, id))
      .returning({ id: userSubscriptions.id, userId: userSubscriptions.userId });

    return updated ?? null;
  }

  private listSelect() {
    return {
      id: userSubscriptions.id,
      userId: userSubscriptions.userId,
      userFirstName: users.firstName,
      userLastName: users.lastName,
      userPhone: users.phone,
      planId: subscriptionPlans.id,
      planDisplayNameEn: sql<string>`COALESCE(${userSubscriptions.planSnapshot}->>'displayNameEn', ${subscriptionPlans.displayNameEn})`,
      planDisplayNameAr: sql<string>`COALESCE(${userSubscriptions.planSnapshot}->>'displayNameAr', ${subscriptionPlans.displayNameAr})`,
      periodStart: userSubscriptions.periodStart,
      periodEnd: userSubscriptions.periodEnd,
      paidEgp: userSubscriptions.paidEgp,
      status: userSubscriptions.status,
      displayStatus: sql<'active' | 'expired'>`
        CASE
          WHEN ${userSubscriptions.status} = 'active' AND ${userSubscriptions.periodEnd} > NOW()
          THEN 'active'
          ELSE 'expired'
        END`,
    };
  }

  private detailSelect() {
    return {
      ...this.listSelect(),
      autoRenew: userSubscriptions.autoRenew,
      paymobOrderId: userSubscriptions.paymobOrderId,
      paymobSubscriptionId: userSubscriptions.paymobSubscriptionId,
      cancelledAt: userSubscriptions.cancelledAt,
      cancellationReason: userSubscriptions.cancellationReason,
      planSnapshot: userSubscriptions.planSnapshot,
      createdAt: userSubscriptions.createdAt,
      updatedAt: userSubscriptions.updatedAt,
    };
  }

  private toListItem(row: SubscriptionListRow) {
    return {
      id: row.id,
      userId: row.userId,
      user: {
        id: row.userId,
        firstName: row.userFirstName,
        lastName: row.userLastName,
        phone: row.userPhone,
      },
      plan: {
        id: row.planId,
        displayNameEn: row.planDisplayNameEn,
        displayNameAr: row.planDisplayNameAr,
      },
      periodStart: row.periodStart,
      periodEnd: row.periodEnd,
      paidEgp: row.paidEgp,
      status: row.status,
      displayStatus: row.displayStatus,
    };
  }

  private toDetail(row: SubscriptionDetailRow) {
    return {
      ...this.toListItem(row),
      autoRenew: row.autoRenew,
      paymobOrderId: row.paymobOrderId,
      paymobSubscriptionId: row.paymobSubscriptionId,
      cancelledAt: row.cancelledAt,
      cancellationReason: row.cancellationReason,
      planSnapshot: row.planSnapshot,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private buildSearchWhere(search: string) {
    const pattern = `%${search}%`;
    return or(
      ilike(users.firstName, pattern),
      ilike(users.lastName, pattern),
      ilike(users.phone, pattern),
      sql`${users.firstName} || ' ' || ${users.lastName} ilike ${pattern}`,
      ilike(subscriptionPlans.displayNameEn, pattern),
      ilike(subscriptionPlans.displayNameAr, pattern),
      sql`${userSubscriptions.planSnapshot}->>'displayNameEn' ilike ${pattern}`,
      sql`${userSubscriptions.planSnapshot}->>'displayNameAr' ilike ${pattern}`,
    );
  }
}
