import { Injectable } from '@nestjs/common';
import {
  and,
  desc,
  eq,
  getTableColumns,
  gt,
  gte,
  inArray,
  isNotNull,
  isNull,
  lt,
  ne,
  or,
  sql,
} from 'drizzle-orm';

import { DrizzleService } from '../../db/drizzle.service';
import { cities } from '../../db/schemas/cities/cities';
import { favorites } from '../../db/schemas/schema-index';
import { listings } from '../../db/schemas/listing/listing';
import { subscriptionPlans } from '../../db/schemas/monetization/subscription-plans';
import { userSessions } from '../../db/schemas/monetization/user-sessions';
import { userSubscriptions } from '../../db/schemas/monetization/user-subscriptions';
import {
  notifications,
  type InsertNotification,
} from '../../db/schemas/notifications/notifications';
import { userFcmTokens } from '../../db/schemas/notifications/user-fcm-tokens';
import { preferences } from '../../db/schemas/preferences/preferences';
import { todos } from '../../db/schemas/todos/todos';
import { users } from '../../db/schemas/user/user';

import type {
  NotificationListItem,
  PushTargetUser,
  SubscriptionExpiryReminderRow,
  TodoReminderRow,
} from '../types/notification-repository.types';

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
    options?: { favorited?: boolean },
  ): Promise<{ data: NotificationListItem[]; total: number }> {
    const offset = (page - 1) * limit;
    const userClause = eq(notifications.userId, userId);
    const favoritedMatchSql = this.userFavoriteExistsForNotification(userId);
    const whereClause =
      options?.favorited === true ? and(userClause, favoritedMatchSql) : userClause;

    const [data, countResult] = await Promise.all([
      this.drizzle.db
        .select({
          ...getTableColumns(notifications),
          isFavorited: sql<boolean>`CASE WHEN ${favoritedMatchSql} THEN true ELSE false END`.as(
            'isFavorited',
          ),
        })
        .from(notifications)
        .where(whereClause)
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset(offset),

      this.drizzle.db
        .select({ total: sql<number>`count(*)::int` })
        .from(notifications)
        .where(whereClause),
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

    return this.aggregatePushTargets(uniqueIds);
  }

  async findNonSeekers(): Promise<PushTargetUser[]> {
    const rows = await this.drizzle.db
      .select({ id: users.id })
      .from(users)
      .where(and(ne(users.type, 'SEEKER'), isNull(users.deactivatedAt)));

    return this.aggregatePushTargets(rows.map((row) => row.id));
  }

  async findUserPushTarget(userId: number): Promise<PushTargetUser | null> {
    const targets = await this.aggregatePushTargets([userId]);
    return targets[0] ?? null;
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

  private async aggregatePushTargets(userIds: number[]): Promise<PushTargetUser[]> {
    if (!userIds.length) {
      return [];
    }

    const now = new Date().toISOString();
    const userRows = await this.drizzle.db
      .select({ id: users.id, language: users.language })
      .from(users)
      .where(and(inArray(users.id, userIds), isNull(users.deactivatedAt)));

    const tokenRows = await this.drizzle.db
      .select({
        userId: userFcmTokens.userId,
        token: userFcmTokens.token,
      })
      .from(userFcmTokens)
      .innerJoin(userSessions, eq(userSessions.id, userFcmTokens.sessionId))
      .where(
        and(
          inArray(userFcmTokens.userId, userIds),
          isNull(userSessions.revokedAt),
          gt(userSessions.expiresAt, now),
        ),
      );

    const tokensByUser = new Map<number, string[]>();
    for (const row of tokenRows) {
      const tokens = tokensByUser.get(row.userId) ?? [];
      tokens.push(row.token);
      tokensByUser.set(row.userId, tokens);
    }

    return userRows.map((user) => ({
      id: user.id,
      language: user.language,
      fcmTokens: tokensByUser.get(user.id) ?? [],
    }));
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
        r.planSnapshot?.displayNameAr ?? r.planDisplayNameAr ?? r.planSnapshot?.name ?? 'اشتراك',
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
      .where(
        and(
          eq(listings.agentId, agentUserId),
          eq(listings.status, 'PUBLISHED'),
          isNotNull(listings.userId),
        ),
      )
      .orderBy(desc(listings.id))
      .limit(1);
    if (assigned?.requesterUserId != null) {
      return { listingId: assigned.listingId, requesterUserId: assigned.requesterUserId };
    }

    const [anyPublished] = await this.drizzle.db
      .select({
        listingId: listings.id,
        requesterUserId: listings.userId,
      })
      .from(listings)
      .where(and(eq(listings.status, 'PUBLISHED'), isNotNull(listings.userId)))
      .orderBy(desc(listings.id))
      .limit(1);
    if (anyPublished?.requesterUserId != null) {
      return { listingId: anyPublished.listingId, requesterUserId: anyPublished.requesterUserId };
    }
    return null;
  }

  private userFavoriteExistsForNotification(userId: number) {
    return sql`EXISTS (
      SELECT 1 FROM ${favorites}
      WHERE ${favorites.userId} = ${userId}
        AND ${favorites.favoritableType} = 'NOTIFICATION'
        AND ${favorites.favoritableId} = ${notifications.id}
    )`;
  }
}
