import { Injectable } from '@nestjs/common';
import { and, eq, gt, inArray, isNull, sql } from 'drizzle-orm';

import { DrizzleService } from '../../db/drizzle.service';
import { userSessions } from '../../db/schemas/monetization/user-sessions';
import { userFcmTokens } from '../../db/schemas/notifications/user-fcm-tokens';

@Injectable()
export class FcmTokenRepo {
  constructor(private readonly drizzle: DrizzleService) {}

  async findActiveSessionForUser(userId: number, sessionId: number) {
    const now = new Date().toISOString();
    const rows = await this.drizzle.db
      .select({
        id: userSessions.id,
        userId: userSessions.userId,
      })
      .from(userSessions)
      .where(
        and(
          eq(userSessions.id, sessionId),
          eq(userSessions.userId, userId),
          isNull(userSessions.revokedAt),
          gt(userSessions.expiresAt, now),
        ),
      )
      .limit(1);

    return rows[0];
  }

  async deleteByToken(token: string): Promise<void> {
    await this.drizzle.db.delete(userFcmTokens).where(eq(userFcmTokens.token, token));
  }

  async deleteBySessionId(sessionId: number): Promise<void> {
    await this.drizzle.db.delete(userFcmTokens).where(eq(userFcmTokens.sessionId, sessionId));
  }

  async deleteBySessionIds(sessionIds: number[]): Promise<void> {
    if (!sessionIds.length) {
      return;
    }
    await this.drizzle.db
      .delete(userFcmTokens)
      .where(inArray(userFcmTokens.sessionId, sessionIds));
  }

  async deleteAllForUser(userId: number): Promise<void> {
    await this.drizzle.db.delete(userFcmTokens).where(eq(userFcmTokens.userId, userId));
  }

  async upsertForSession(userId: number, sessionId: number, token: string): Promise<void> {
    const now = new Date().toISOString();
    await this.drizzle.db
      .insert(userFcmTokens)
      .values({ userId, sessionId, token, updatedAt: now })
      .onConflictDoUpdate({
        target: userFcmTokens.sessionId,
        set: { token, updatedAt: now },
      });
  }

  async deleteOrphanedTokens(): Promise<number> {
    const result = await this.drizzle.db.execute(sql`
      DELETE FROM user_fcm_tokens
      WHERE session_id IN (
        SELECT id FROM user_sessions
        WHERE revoked_at IS NOT NULL OR expires_at <= NOW()
      )
    `);

    return Number(result.rowCount ?? 0);
  }
}
