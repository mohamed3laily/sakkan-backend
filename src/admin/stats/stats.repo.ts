import { Injectable } from '@nestjs/common';
import { and, AnyColumn, count, eq, isNotNull, sql } from 'drizzle-orm';

import { DrizzleService } from 'src/modules/db/drizzle.service';
import { listings } from 'src/modules/db/schemas/listing/listing';
import { propertyType } from 'src/modules/db/schemas/listing/property-type';
import { payments } from 'src/modules/db/schemas/monetization/payments';
import { userSubscriptions } from 'src/modules/db/schemas/monetization/user-subscriptions';
import { users } from 'src/modules/db/schemas/user/user';
import { ACTIVE_SUBSCRIPTION_CONDITION } from 'src/modules/monetization/subscription/active-subscription.sql';

const CAIRO_TZ = 'Africa/Cairo';

const THIS_MONTH_START = sql`date_trunc('month', (NOW() AT TIME ZONE ${CAIRO_TZ}))`;
const NEXT_MONTH_START = sql`date_trunc('month', (NOW() AT TIME ZONE ${CAIRO_TZ})) + interval '1 month'`;
const LAST_MONTH_START = sql`date_trunc('month', (NOW() AT TIME ZONE ${CAIRO_TZ})) - interval '1 month'`;

const IN_THIS_MONTH = (column: AnyColumn) =>
  sql`(${column} AT TIME ZONE ${CAIRO_TZ}) >= ${THIS_MONTH_START} AND (${column} AT TIME ZONE ${CAIRO_TZ}) < ${NEXT_MONTH_START}`;

const IN_LAST_MONTH = (column: AnyColumn) =>
  sql`(${column} AT TIME ZONE ${CAIRO_TZ}) >= ${LAST_MONTH_START} AND (${column} AT TIME ZONE ${CAIRO_TZ}) < ${THIS_MONTH_START}`;

@Injectable()
export class StatsRepo {
  constructor(private readonly drizzleService: DrizzleService) {}

  async getSummaryRaw() {
    const [
      [{ totalUsers }],
      [{ newUsersThisMonth }],
      [{ newUsersLastMonth }],
      [{ totalListings }],
      [{ newListingsThisMonth }],
      [{ newListingsLastMonth }],
      [{ activeSubscriptions }],
      [{ newSubscriptionsThisMonth }],
      [{ newSubscriptionsLastMonth }],
      [{ monthlyRevenue }],
      [{ monthlyRevenueLastMonth }],
    ] = await Promise.all([
      this.drizzleService.db.select({ totalUsers: count() }).from(users),
      this.drizzleService.db
        .select({ newUsersThisMonth: count() })
        .from(users)
        .where(IN_THIS_MONTH(users.createdAt)),
      this.drizzleService.db
        .select({ newUsersLastMonth: count() })
        .from(users)
        .where(IN_LAST_MONTH(users.createdAt)),
      this.drizzleService.db.select({ totalListings: count() }).from(listings),
      this.drizzleService.db
        .select({ newListingsThisMonth: count() })
        .from(listings)
        .where(IN_THIS_MONTH(listings.createdAt)),
      this.drizzleService.db
        .select({ newListingsLastMonth: count() })
        .from(listings)
        .where(IN_LAST_MONTH(listings.createdAt)),
      this.drizzleService.db
        .select({ activeSubscriptions: count() })
        .from(userSubscriptions)
        .where(ACTIVE_SUBSCRIPTION_CONDITION),
      this.drizzleService.db
        .select({ newSubscriptionsThisMonth: count() })
        .from(userSubscriptions)
        .where(IN_THIS_MONTH(userSubscriptions.createdAt)),
      this.drizzleService.db
        .select({ newSubscriptionsLastMonth: count() })
        .from(userSubscriptions)
        .where(IN_LAST_MONTH(userSubscriptions.createdAt)),
      this.drizzleService.db
        .select({
          monthlyRevenue: sql<number>`COALESCE(SUM(${payments.amountPiasters}), 0) / 100.0`,
        })
        .from(payments)
        .where(and(eq(payments.status, 'success'), IN_THIS_MONTH(payments.createdAt))),
      this.drizzleService.db
        .select({
          monthlyRevenueLastMonth: sql<number>`COALESCE(SUM(${payments.amountPiasters}), 0) / 100.0`,
        })
        .from(payments)
        .where(and(eq(payments.status, 'success'), IN_LAST_MONTH(payments.createdAt))),
    ]);

    return {
      totalUsers: Number(totalUsers),
      newUsersThisMonth: Number(newUsersThisMonth),
      newUsersLastMonth: Number(newUsersLastMonth),
      totalListings: Number(totalListings),
      newListingsThisMonth: Number(newListingsThisMonth),
      newListingsLastMonth: Number(newListingsLastMonth),
      activeSubscriptions: Number(activeSubscriptions),
      newSubscriptionsThisMonth: Number(newSubscriptionsThisMonth),
      newSubscriptionsLastMonth: Number(newSubscriptionsLastMonth),
      monthlyRevenue: Number(monthlyRevenue),
      monthlyRevenueLastMonth: Number(monthlyRevenueLastMonth),
    };
  }

  async getUserGrowthRaw(months: number) {
    const result = await this.drizzleService.db.execute<{
      month: string;
      month_start: string;
      count: string;
    }>(sql`
      WITH month_series AS (
        SELECT generate_series(
          date_trunc('month', (NOW() AT TIME ZONE ${CAIRO_TZ})) - (${months - 1} * interval '1 month'),
          date_trunc('month', (NOW() AT TIME ZONE ${CAIRO_TZ})),
          interval '1 month'
        ) AS month_start
      )
      SELECT
        to_char(ms.month_start, 'Mon') AS month,
        ms.month_start::text AS month_start,
        (
          SELECT COUNT(*)::int
          FROM ${users}
          WHERE (${users.createdAt} AT TIME ZONE ${CAIRO_TZ}) < ms.month_start + interval '1 month'
        )::text AS count
      FROM month_series ms
      ORDER BY ms.month_start
    `);

    return result.rows.map((row) => ({
      month: row.month,
      monthStart: row.month_start,
      count: Number(row.count),
    }));
  }

  async getListingsGrowthRaw(months: number) {
    const result = await this.drizzleService.db.execute<{
      month: string;
      month_start: string;
      count: string;
    }>(sql`
      WITH month_series AS (
        SELECT generate_series(
          date_trunc('month', (NOW() AT TIME ZONE ${CAIRO_TZ})) - (${months - 1} * interval '1 month'),
          date_trunc('month', (NOW() AT TIME ZONE ${CAIRO_TZ})),
          interval '1 month'
        ) AS month_start
      )
      SELECT
        to_char(ms.month_start, 'Mon') AS month,
        ms.month_start::text AS month_start,
        (
          SELECT COUNT(*)::int
          FROM ${listings}
          WHERE (${listings.createdAt} AT TIME ZONE ${CAIRO_TZ}) >= ms.month_start
            AND (${listings.createdAt} AT TIME ZONE ${CAIRO_TZ}) < ms.month_start + interval '1 month'
        )::text AS count
      FROM month_series ms
      ORDER BY ms.month_start
    `);

    return result.rows.map((row) => ({
      month: row.month,
      monthStart: row.month_start,
      count: Number(row.count),
    }));
  }

  async getListingsByPropertyTypeRaw() {
    const rows = await this.drizzleService.db
      .select({
        propertyTypeId: propertyType.id,
        parent: propertyType.parent,
        nameEn: propertyType.nameEn,
        nameAr: propertyType.nameAr,
        count: count(),
      })
      .from(listings)
      .innerJoin(propertyType, eq(listings.propertyTypeId, propertyType.id))
      .where(isNotNull(listings.propertyTypeId))
      .groupBy(propertyType.id, propertyType.parent, propertyType.nameEn, propertyType.nameAr);

    return rows.map((row) => ({
      propertyTypeId: row.propertyTypeId,
      parent: row.parent,
      nameEn: row.nameEn ?? '',
      nameAr: row.nameAr ?? '',
      count: Number(row.count),
    }));
  }
}
