import { Injectable } from '@nestjs/common';
import { and, desc, eq, gte, inArray, isNotNull, isNull, lt, ne, or, sql } from 'drizzle-orm';

import { DrizzleService } from '../../db/drizzle.service';
import { cities } from '../../db/schemas/cities/cities';
import { listings } from '../../db/schemas/listing/listing';
import { subscriptionPlans } from '../../db/schemas/monetization/subscription-plans';
import { userSubscriptions } from '../../db/schemas/monetization/user-subscriptions';
import {
  notifications,
  type InsertNotification,
  type SelectNotification,
} from '../../db/schemas/notifications/notifications';
import { preferences } from '../../db/schemas/preferences/preferences';
import { todos } from '../../db/schemas/todos/todos';
import { users } from '../../db/schemas/user/user';

export type PushTargetUser = {
  id: number;
  fcmToken: string | null;
  language: string;
};

export type TodoReminderRow = {
  id: number;
  title: string;
  userId: number;
  fcmToken: string | null;
  language: string;
};

export type SubscriptionExpiryReminderRow = {
  userSubscriptionId: number;
  userId: number;
  planNameEn: string;
  planNameAr: string;
};

@Injectable()
export class NotificationRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async insertMany(rows: InsertNotification[]): Promise<void> {
    if (!rows.length) {
      return;
    }
    await this.drizzle.db.insert(notifications).values(rows);
  }

  async findForUser(
    userId: number,
    page: number,
    limit: number,
  ): Promise<{ data: SelectNotification[]; total: number }> {
    const offset = (page - 1) * limit;

    const [data, countResult] = await Promise.all([
      this.drizzle.db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset(offset),

      this.drizzle.db
        .select({ total: sql<number>`count(*)::int` })
        .from(notifications)
        .where(eq(notifications.userId, userId)),
    ]);

    const total = countResult[0]?.total ?? 0;
    return { data, total };
  }

  async markAllAsRead(userId: number) {
    return this.drizzle.db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  }

  async unreadCount(userId: number): Promise<number> {
    const [row] = await this.drizzle.db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
    return row?.count ?? 0;
  }

  async findUsersMatchingPreferences(
    areaIds: number[],
    propertyTypeId: number,
  ): Promise<PushTargetUser[]> {
    const areaMatch = and(
      eq(preferences.preferableType, 'AREA'),
      inArray(preferences.preferableId, areaIds),
    );
    const propertyMatch = and(
      eq(preferences.preferableType, 'PROPERTY_TYPE'),
      eq(preferences.preferableId, propertyTypeId),
    );

    const matches = await this.drizzle.db
      .select({ userId: preferences.userId })
      .from(preferences)
      .innerJoin(users, eq(preferences.userId, users.id))
      .where(and(isNull(users.deactivatedAt), or(areaMatch, propertyMatch)));

    const uniqueIds = [...new Set(matches.map((m) => m.userId))];
    if (!uniqueIds.length) {
      return [];
    }

    return this.drizzle.db
      .select({
        id: users.id,
        fcmToken: users.fcmToken,
        language: users.language,
      })
      .from(users)
      .where(inArray(users.id, uniqueIds));
  }

  async findNonSeekers(): Promise<PushTargetUser[]> {
    return this.drizzle.db
      .select({
        id: users.id,
        fcmToken: users.fcmToken,
        language: users.language,
      })
      .from(users)
      .where(and(ne(users.type, 'SEEKER'), isNull(users.deactivatedAt)));
  }

  async findUserPushTarget(userId: number): Promise<PushTargetUser | null> {
    const [user] = await this.drizzle.db
      .select({
        id: users.id,
        fcmToken: users.fcmToken,
        language: users.language,
      })
      .from(users)
      .where(eq(users.id, userId));
    return user ?? null;
  }

  async findRequesterDisplayName(userId: number): Promise<string> {
    const [row] = await this.drizzle.db
      .select({
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(users)
      .where(eq(users.id, userId));
    if (!row) {
      return '';
    }
    return `${row.firstName} ${row.lastName}`.trim();
  }

  async findTodosDueInTwoHours(): Promise<TodoReminderRow[]> {
    const now = Date.now();
    const windowStart = new Date(now + 110 * 60 * 1000).toISOString();
    const windowEnd = new Date(now + 120 * 60 * 1000).toISOString();

    return this.drizzle.db
      .select({
        id: todos.id,
        title: todos.title,
        userId: todos.userId,
        fcmToken: users.fcmToken,
        language: users.language,
      })
      .from(todos)
      .innerJoin(users, eq(todos.userId, users.id))
      .where(
        and(
          isNull(todos.doneAt),
          isNull(users.deactivatedAt),
          eq(todos.remindMe, true),
          isNotNull(todos.dueDate),
          gte(todos.dueDate, windowStart),
          lt(todos.dueDate, windowEnd),
        ),
      );
  }

  async findSubscriptionsNearingExpiry(
    daysBeforeEnd: number,
    windowMs: number,
  ): Promise<SubscriptionExpiryReminderRow[]> {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const windowStart = new Date(now + daysBeforeEnd * dayMs);
    const windowEnd = new Date(now + daysBeforeEnd * dayMs + windowMs);

    const raw = await this.drizzle.db
      .select({
        userSubscriptionId: userSubscriptions.id,
        userId: userSubscriptions.userId,
        planSnapshot: userSubscriptions.planSnapshot,
        planDisplayNameEn: subscriptionPlans.displayNameEn,
        planDisplayNameAr: subscriptionPlans.displayNameAr,
      })
      .from(userSubscriptions)
      .innerJoin(users, eq(userSubscriptions.userId, users.id))
      .innerJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
      .where(
        and(
          eq(userSubscriptions.status, 'active'),
          isNull(users.deactivatedAt),
          gte(userSubscriptions.periodEnd, windowStart),
          lt(userSubscriptions.periodEnd, windowEnd),
        ),
      );

    return raw.map((r) => ({
      userSubscriptionId: r.userSubscriptionId,
      userId: r.userId,
      planNameEn:
        r.planSnapshot?.displayNameEn ??
        r.planDisplayNameEn ??
        r.planSnapshot?.name ??
        'Subscription',
      planNameAr:
        r.planSnapshot?.displayNameAr ??
        r.planDisplayNameAr ??
        r.planSnapshot?.name ??
        'اشتراك',
    }));
  }

  async findFixturePreferenceMatch(): Promise<{
    listingId: number;
    cityId: number;
    cityName: string;
    areaIds: number[];
    propertyTypeId: number;
  } | null> {
    const [row] = await this.drizzle.db
      .select({
        listingId: listings.id,
        cityId: listings.cityId,
        cityName: cities.nameEn,
        areaIds: listings.areaIds,
        propertyTypeId: listings.propertyTypeId,
      })
      .from(listings)
      .innerJoin(cities, eq(listings.cityId, cities.id))
      .where(
        and(
          eq(listings.status, 'PUBLISHED'),
          isNotNull(listings.propertyTypeId),
          isNotNull(listings.areaIds),
          sql`array_length(${listings.areaIds}, 1) > 0`,
        ),
      )
      .orderBy(desc(listings.createdAt))
      .limit(1);

    if (!row?.areaIds?.length || row.propertyTypeId === null) {
      return null;
    }

    return {
      listingId: row.listingId,
      cityId: row.cityId,
      cityName: row.cityName,
      areaIds: row.areaIds,
      propertyTypeId: row.propertyTypeId,
    };
  }

  async findFixtureSeriousListing(): Promise<{
    listingId: number;
    cityName: string;
    listingType: string;
  } | null> {
    const [row] = await this.drizzle.db
      .select({
        listingId: listings.id,
        cityName: cities.nameEn,
        listingType: listings.listingType,
      })
      .from(listings)
      .innerJoin(cities, eq(listings.cityId, cities.id))
      .where(and(eq(listings.status, 'PUBLISHED'), eq(listings.listingType, 'REQUEST')))
      .orderBy(desc(listings.createdAt))
      .limit(1);

    return row ?? null;
  }

  async findFixtureTodoForUser(userId: number): Promise<{ id: number; title: string } | null> {
    const [row] = await this.drizzle.db
      .select({ id: todos.id, title: todos.title })
      .from(todos)
      .where(and(eq(todos.userId, userId), isNull(todos.doneAt)))
      .orderBy(desc(todos.id))
      .limit(1);
    return row ?? null;
  }

  async findFixtureSubscriptionForUser(userId: number): Promise<{
    userSubscriptionId: number;
    planNameEn: string;
    planNameAr: string;
  } | null> {
    const [row] = await this.drizzle.db
      .select({
        id: userSubscriptions.id,
        planSnapshot: userSubscriptions.planSnapshot,
        displayNameEn: subscriptionPlans.displayNameEn,
        displayNameAr: subscriptionPlans.displayNameAr,
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

    if (!row) {
      return null;
    }

    return {
      userSubscriptionId: row.id,
      planNameEn: row.planSnapshot?.displayNameEn ?? row.displayNameEn,
      planNameAr: row.planSnapshot?.displayNameAr ?? row.displayNameAr,
    };
  }

  async findFixtureListingRequestForAgent(agentUserId: number): Promise<{
    listingId: number;
    requesterUserId: number;
  } | null> {
    const [assigned] = await this.drizzle.db
      .select({
        listingId: listings.id,
        requesterUserId: listings.userId,
      })
      .from(listings)
      .where(and(eq(listings.agentId, agentUserId), eq(listings.status, 'PUBLISHED')))
      .orderBy(desc(listings.id))
      .limit(1);
    if (assigned) {
      return assigned;
    }

    const [anyPublished] = await this.drizzle.db
      .select({
        listingId: listings.id,
        requesterUserId: listings.userId,
      })
      .from(listings)
      .where(eq(listings.status, 'PUBLISHED'))
      .orderBy(desc(listings.id))
      .limit(1);
    return anyPublished ?? null;
  }
}
