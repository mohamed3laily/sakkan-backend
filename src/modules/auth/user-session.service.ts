import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { FcmTokenService } from '../notification/services/fcm-token.service';
import { SelectUserSession } from '../db/schemas/monetization/user-sessions';
import type { SessionRevokeReason } from './session-auth-codes';
import { UserSessionRepo } from './user-session.repo';

export type RefreshResolution =
  | { status: 'valid'; session: SelectUserSession }
  | { status: 'revoked'; reason: SessionRevokeReason | null }
  | { status: 'expired' }
  | { status: 'invalid' };

export type SessionStatus =
  | { active: true }
  | { active: false; reason: SessionRevokeReason | null; expired: boolean };

@Injectable()
export class UserSessionService {
  private static readonly BCRYPT_SALT_ROUNDS = 10;
  private static readonly REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

  constructor(
    private readonly userSessionRepo: UserSessionRepo,
    private readonly fcmTokenService: FcmTokenService,
  ) {}

  async getDeviceLimit(userId: number): Promise<number> {
    return (await this.userSessionRepo.findDeviceLimit(userId)) ?? 1;
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
      const existing = await this.userSessionRepo.findByUserAndInstallationId(
        userId,
        options.installationId,
      );

      if (existing) {
        await this.userSessionRepo.reactivateSession(existing.id, {
          refreshTokenHash: hash,
          tokenLookup: lookup,
          expiresAt,
          lastSeenAt: now,
          deviceLabel: options.deviceLabel?.trim() || existing.deviceLabel,
          updatedAt: now,
        });

        return {
          sessionId: existing.id,
          installationId: existing.deviceFingerprint,
        };
      }
    }

    const installationId = crypto.randomUUID();
    const limit = await this.getDeviceLimit(userId);
    const activeSessions = await this.userSessionRepo.findActiveByUserId(userId);

    if (activeSessions.length >= limit) {
      const overflowCount = activeSessions.length - limit + 1;
      await this.revokeOldest(userId, overflowCount);
    }

    const sessionId = await this.userSessionRepo.insertSession({
      userId,
      deviceFingerprint: installationId,
      deviceLabel: options?.deviceLabel?.trim() || null,
      refreshTokenHash: hash,
      tokenLookup: lookup,
      expiresAt,
      lastSeenAt: now,
    });

    return { sessionId, installationId };
  }

  async resolveRefreshToken(plainToken: string): Promise<RefreshResolution> {
    const lookup = this.tokenLookup(plainToken);
    const session = await this.userSessionRepo.findByTokenLookup(lookup);

    if (!session) {
      return { status: 'invalid' };
    }

    const valid = await bcrypt.compare(plainToken, session.refreshTokenHash);
    if (!valid) {
      return { status: 'invalid' };
    }

    if (session.revokedAt) {
      return { status: 'revoked', reason: session.revokedReason };
    }

    if (new Date(session.expiresAt) <= new Date()) {
      return { status: 'expired' };
    }

    return { status: 'valid', session };
  }

  async rotateRefreshToken(sessionId: number, newPlainToken: string): Promise<void> {
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + UserSessionService.REFRESH_TTL_MS).toISOString();
    const { hash, lookup } = await this.hashRefreshToken(newPlainToken);

    await this.userSessionRepo.updateTokenRotation(sessionId, {
      refreshTokenHash: hash,
      tokenLookup: lookup,
      expiresAt,
      lastSeenAt: now,
      updatedAt: now,
    });
  }

  async revokeSession(
    sessionId: number,
    reason: SessionRevokeReason,
    userId?: number,
  ): Promise<void> {
    const now = new Date().toISOString();
    await this.userSessionRepo.revokeById(sessionId, reason, now, userId);
    await this.fcmTokenService.deleteBySessionId(sessionId);
  }

  async revokeAllForUser(userId: number, reason: SessionRevokeReason): Promise<void> {
    const now = new Date().toISOString();
    await this.userSessionRepo.revokeAllActiveByUserId(userId, reason, now);
    await this.fcmTokenService.deleteAllForUser(userId);
  }

  async getSessionStatus(sessionId: number): Promise<SessionStatus> {
    const session = await this.userSessionRepo.findStatusById(sessionId);

    if (!session) {
      return { active: false, reason: null, expired: true };
    }

    if (session.revokedAt) {
      return { active: false, reason: session.revokedReason, expired: false };
    }

    if (new Date(session.expiresAt) <= new Date()) {
      return { active: false, reason: null, expired: true };
    }

    return { active: true };
  }

  getActiveDevices(userId: number) {
    return this.userSessionRepo.findActiveDevices(userId);
  }

  private async revokeOldest(userId: number, count: number): Promise<void> {
    if (count <= 0) {
      return;
    }

    const activeSessions = await this.userSessionRepo.findActiveByUserId(userId);
    const sessionIds = activeSessions.slice(0, count).map((session) => session.id);
    const now = new Date().toISOString();

    await this.userSessionRepo.revokeByIds(sessionIds, 'device_limit', now);
    await this.fcmTokenService.deleteBySessionIds(sessionIds);
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
