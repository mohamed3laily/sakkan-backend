import { Injectable } from '@nestjs/common';
import { and, asc, eq, gt, isNull, sql } from 'drizzle-orm';

import { DrizzleService } from '../db/drizzle.service';
import {
  SelectUserSession,
  userSessions,
} from '../db/schemas/monetization/user-sessions';
import { subscriptionPlans } from '../db/schemas/monetization/subscription-plans';
import { userSubscriptions } from '../db/schemas/monetization/user-subscriptions';
import type { SessionRevokeReason } from './session-auth-codes';

@Injectable()
export class UserSessionRepo {
  constructor(private readonly drizzle: DrizzleService) {}

  async findDeviceLimit(userId: number): Promise<number | null> {
    const rows = await this.drizzle.db
      .select({ deviceLimit: subscriptionPlans.deviceLimit })
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

    return rows[0]?.deviceLimit ?? null;
  }

  async findByUserAndInstallationId(
    userId: number,
    installationId: string,
  ): Promise<SelectUserSession | undefined> {
    const rows = await this.drizzle.db
      .select()
      .from(userSessions)
      .where(
        and(
          eq(userSessions.userId, userId),
          eq(userSessions.deviceFingerprint, installationId),
        ),
      )
      .limit(1);

    return rows[0];
  }

  async findByTokenLookup(lookup: string): Promise<SelectUserSession | undefined> {
    const rows = await this.drizzle.db
      .select()
      .from(userSessions)
      .where(eq(userSessions.tokenLookup, lookup))
      .limit(1);

    return rows[0];
  }

  async findActiveByUserId(userId: number): Promise<SelectUserSession[]> {
    const now = new Date().toISOString();
    return this.drizzle.db
      .select()
      .from(userSessions)
      .where(
        and(
          eq(userSessions.userId, userId),
          isNull(userSessions.revokedAt),
          gt(userSessions.expiresAt, now),
        ),
      )
      .orderBy(asc(userSessions.lastSeenAt));
  }

  async findStatusById(sessionId: number) {
    const rows = await this.drizzle.db
      .select({
        revokedAt: userSessions.revokedAt,
        revokedReason: userSessions.revokedReason,
        expiresAt: userSessions.expiresAt,
      })
      .from(userSessions)
      .where(eq(userSessions.id, sessionId))
      .limit(1);

    return rows[0];
  }

  async findActiveDevices(userId: number) {
    const now = new Date().toISOString();
    return this.drizzle.db
      .select({
        id: userSessions.id,
        deviceLabel: userSessions.deviceLabel,
        lastSeenAt: userSessions.lastSeenAt,
        createdAt: userSessions.createdAt,
      })
      .from(userSessions)
      .where(
        and(
          eq(userSessions.userId, userId),
          isNull(userSessions.revokedAt),
          gt(userSessions.expiresAt, now),
        ),
      )
      .orderBy(asc(userSessions.lastSeenAt));
  }

  async insertSession(data: {
    userId: number;
    deviceFingerprint: string;
    deviceLabel: string | null;
    refreshTokenHash: string;
    tokenLookup: string;
    expiresAt: string;
    lastSeenAt: string;
  }): Promise<number> {
    const [inserted] = await this.drizzle.db
      .insert(userSessions)
      .values(data)
      .returning({ id: userSessions.id });

    return inserted.id;
  }

  async reactivateSession(
    sessionId: number,
    data: {
      refreshTokenHash: string;
      tokenLookup: string;
      expiresAt: string;
      lastSeenAt: string;
      deviceLabel: string | null;
      updatedAt: string;
    },
  ): Promise<void> {
    await this.drizzle.db
      .update(userSessions)
      .set({
        ...data,
        revokedAt: null,
        revokedReason: null,
      })
      .where(eq(userSessions.id, sessionId));
  }

  async updateTokenRotation(
    sessionId: number,
    data: {
      refreshTokenHash: string;
      tokenLookup: string;
      expiresAt: string;
      lastSeenAt: string;
      updatedAt: string;
    },
  ): Promise<void> {
    await this.drizzle.db.update(userSessions).set(data).where(eq(userSessions.id, sessionId));
  }

  async revokeById(
    sessionId: number,
    reason: SessionRevokeReason,
    revokedAt: string,
    userId?: number,
  ): Promise<void> {
    const conditions = [eq(userSessions.id, sessionId)];
    if (userId !== undefined) {
      conditions.push(eq(userSessions.userId, userId));
    }

    await this.drizzle.db
      .update(userSessions)
      .set({ revokedAt, revokedReason: reason, updatedAt: revokedAt })
      .where(and(...conditions));
  }

  async revokeAllActiveByUserId(
    userId: number,
    reason: SessionRevokeReason,
    revokedAt: string,
  ): Promise<void> {
    await this.drizzle.db
      .update(userSessions)
      .set({ revokedAt, revokedReason: reason, updatedAt: revokedAt })
      .where(and(eq(userSessions.userId, userId), isNull(userSessions.revokedAt)));
  }

  async revokeByIds(
    sessionIds: number[],
    reason: SessionRevokeReason,
    revokedAt: string,
  ): Promise<void> {
    for (const sessionId of sessionIds) {
      await this.drizzle.db
        .update(userSessions)
        .set({ revokedAt, revokedReason: reason, updatedAt: revokedAt })
        .where(eq(userSessions.id, sessionId));
    }
  }
}
