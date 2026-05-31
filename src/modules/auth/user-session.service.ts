import { Injectable } from '@nestjs/common';
import { and, asc, eq, gt, isNull, sql } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { DrizzleService } from '../db/drizzle.service';
import {
  SelectUserSession,
  userSessions,
} from '../db/schemas/monetization/user-sessions';
import { subscriptionPlans } from '../db/schemas/monetization/subscription-plans';
import { userSubscriptions } from '../db/schemas/monetization/user-subscriptions';

@Injectable()
export class UserSessionService {
  private static readonly BCRYPT_SALT_ROUNDS = 10;
  private static readonly REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

  constructor(private readonly drizzle: DrizzleService) {}

  async getDeviceLimit(userId: number): Promise<number> {
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

    return rows[0]?.deviceLimit ?? 1;
  }

  async establishSession(
    userId: number,
    plainRefreshToken: string,
    options?: { deviceLabel?: string; installationId?: string },
  ): Promise<{ sessionId: number; installationId: string }> {
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + UserSessionService.REFRESH_TTL_MS).toISOString();
    const { hash, lookup } = await this.hashRefreshToken(plainRefreshToken);

    if (options?.installationId) {
      const existing = await this.drizzle.db
        .select()
        .from(userSessions)
        .where(
          and(
            eq(userSessions.userId, userId),
            eq(userSessions.deviceFingerprint, options.installationId),
          ),
        )
        .limit(1);

      if (existing[0]) {
        await this.drizzle.db
          .update(userSessions)
          .set({
            refreshTokenHash: hash,
            tokenLookup: lookup,
            expiresAt,
            lastSeenAt: now,
            revokedAt: null,
            deviceLabel: options.deviceLabel?.trim() || existing[0].deviceLabel,
            updatedAt: now,
          })
          .where(eq(userSessions.id, existing[0].id));

        return {
          sessionId: existing[0].id,
          installationId: existing[0].deviceFingerprint,
        };
      }
    }

    const installationId = crypto.randomUUID();

    const limit = await this.getDeviceLimit(userId);
    const activeSessions = await this.getActiveSessionRows(userId);

    if (activeSessions.length >= limit) {
      const overflowCount = activeSessions.length - limit + 1;
      await this.revokeOldest(userId, overflowCount);
    }

    const [inserted] = await this.drizzle.db
      .insert(userSessions)
      .values({
        userId,
        deviceFingerprint: installationId,
        deviceLabel: options?.deviceLabel?.trim() || null,
        refreshTokenHash: hash,
        tokenLookup: lookup,
        expiresAt,
        lastSeenAt: now,
      })
      .returning({ id: userSessions.id });

    return { sessionId: inserted.id, installationId };
  }

  async validateRefreshToken(plainToken: string): Promise<SelectUserSession | null> {
    const lookup = this.tokenLookup(plainToken);

    const rows = await this.drizzle.db
      .select()
      .from(userSessions)
      .where(eq(userSessions.tokenLookup, lookup))
      .limit(1);

    const session = rows[0];
    if (!session || session.revokedAt) {
      return null;
    }

    if (new Date(session.expiresAt) <= new Date()) {
      return null;
    }

    const valid = await bcrypt.compare(plainToken, session.refreshTokenHash);
    return valid ? session : null;
  }

  async rotateRefreshToken(sessionId: number, newPlainToken: string): Promise<void> {
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + UserSessionService.REFRESH_TTL_MS).toISOString();
    const { hash, lookup } = await this.hashRefreshToken(newPlainToken);

    await this.drizzle.db
      .update(userSessions)
      .set({
        refreshTokenHash: hash,
        tokenLookup: lookup,
        expiresAt,
        lastSeenAt: now,
        updatedAt: now,
      })
      .where(eq(userSessions.id, sessionId));
  }

  async revokeSession(sessionId: number, userId?: number): Promise<void> {
    const now = new Date().toISOString();
    const conditions = [eq(userSessions.id, sessionId)];
    if (userId !== undefined) {
      conditions.push(eq(userSessions.userId, userId));
    }

    await this.drizzle.db
      .update(userSessions)
      .set({ revokedAt: now, updatedAt: now })
      .where(and(...conditions));
  }

  async revokeAllForUser(userId: number): Promise<void> {
    const now = new Date().toISOString();
    await this.drizzle.db
      .update(userSessions)
      .set({ revokedAt: now, updatedAt: now })
      .where(and(eq(userSessions.userId, userId), isNull(userSessions.revokedAt)));
  }

  async isSessionActive(sessionId: number): Promise<boolean> {
    const rows = await this.drizzle.db
      .select({
        revokedAt: userSessions.revokedAt,
        expiresAt: userSessions.expiresAt,
      })
      .from(userSessions)
      .where(eq(userSessions.id, sessionId))
      .limit(1);

    const session = rows[0];
    if (!session || session.revokedAt) {
      return false;
    }

    return new Date(session.expiresAt) > new Date();
  }

  getActiveDevices(userId: number) {
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

  private async revokeOldest(userId: number, count: number): Promise<void> {
    if (count <= 0) {
      return;
    }

    const activeSessions = await this.getActiveSessionRows(userId);
    const toRevoke = activeSessions.slice(0, count);
    const now = new Date().toISOString();

    for (const session of toRevoke) {
      await this.drizzle.db
        .update(userSessions)
        .set({ revokedAt: now, updatedAt: now })
        .where(eq(userSessions.id, session.id));
    }
  }

  private async getActiveSessionRows(userId: number): Promise<SelectUserSession[]> {
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

  private async hashRefreshToken(
    plainToken: string,
  ): Promise<{ hash: string; lookup: string }> {
    const hash = await bcrypt.hash(plainToken, UserSessionService.BCRYPT_SALT_ROUNDS);
    return { hash, lookup: this.tokenLookup(plainToken) };
  }

  private tokenLookup(plainToken: string): string {
    return crypto.createHash('sha256').update(plainToken).digest('hex');
  }
}
