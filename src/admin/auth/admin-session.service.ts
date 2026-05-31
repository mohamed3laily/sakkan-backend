import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { DrizzleService } from 'src/modules/db/drizzle.service';
import {
  adminSessions,
  SelectAdminSession,
} from 'src/modules/db/schemas/admins/admin-sessions';

@Injectable()
export class AdminSessionService {
  private static readonly BCRYPT_SALT_ROUNDS = 10;
  private static readonly REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

  constructor(private readonly drizzle: DrizzleService) {}

  async establishSession(
    adminId: number,
    plainRefreshToken: string,
  ): Promise<{ sessionId: number }> {
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + AdminSessionService.REFRESH_TTL_MS).toISOString();
    const { hash, lookup } = await this.hashRefreshToken(plainRefreshToken);

    const [inserted] = await this.drizzle.db
      .insert(adminSessions)
      .values({
        adminId,
        refreshTokenHash: hash,
        tokenLookup: lookup,
        expiresAt,
        lastSeenAt: now,
      })
      .returning({ id: adminSessions.id });

    return { sessionId: inserted.id };
  }

  async validateRefreshToken(plainToken: string): Promise<SelectAdminSession | null> {
    const lookup = this.tokenLookup(plainToken);

    const rows = await this.drizzle.db
      .select()
      .from(adminSessions)
      .where(eq(adminSessions.tokenLookup, lookup))
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
    const expiresAt = new Date(Date.now() + AdminSessionService.REFRESH_TTL_MS).toISOString();
    const { hash, lookup } = await this.hashRefreshToken(newPlainToken);

    await this.drizzle.db
      .update(adminSessions)
      .set({
        refreshTokenHash: hash,
        tokenLookup: lookup,
        expiresAt,
        lastSeenAt: now,
        updatedAt: now,
      })
      .where(eq(adminSessions.id, sessionId));
  }

  async revokeSession(sessionId: number, adminId?: number): Promise<void> {
    const now = new Date().toISOString();
    const conditions = [eq(adminSessions.id, sessionId)];
    if (adminId !== undefined) {
      conditions.push(eq(adminSessions.adminId, adminId));
    }

    await this.drizzle.db
      .update(adminSessions)
      .set({ revokedAt: now, updatedAt: now })
      .where(and(...conditions));
  }

  async isSessionActive(sessionId: number): Promise<boolean> {
    const rows = await this.drizzle.db
      .select({
        revokedAt: adminSessions.revokedAt,
        expiresAt: adminSessions.expiresAt,
      })
      .from(adminSessions)
      .where(eq(adminSessions.id, sessionId))
      .limit(1);

    const session = rows[0];
    if (!session || session.revokedAt) {
      return false;
    }

    return new Date(session.expiresAt) > new Date();
  }

  private async hashRefreshToken(
    plainToken: string,
  ): Promise<{ hash: string; lookup: string }> {
    const hash = await bcrypt.hash(plainToken, AdminSessionService.BCRYPT_SALT_ROUNDS);
    return { hash, lookup: this.tokenLookup(plainToken) };
  }

  private tokenLookup(plainToken: string): string {
    return crypto.createHash('sha256').update(plainToken).digest('hex');
  }
}
