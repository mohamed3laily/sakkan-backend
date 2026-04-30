import { Injectable } from '@nestjs/common';
import { and, desc, eq, gte, inArray, isNotNull, isNull, lt, ne, or, sql } from 'drizzle-orm';

import { DrizzleService } from '../../db/drizzle.service';
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
}
