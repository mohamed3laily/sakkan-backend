import { Injectable, UnauthorizedException } from '@nestjs/common';

import { FcmTokenRepo } from '../repositories/fcm-token.repo';

@Injectable()
export class FcmTokenService {
  constructor(private readonly fcmTokenRepo: FcmTokenRepo) {}

  async registerForSession(userId: number, sessionId: number, token: string): Promise<void> {
    const session = await this.fcmTokenRepo.findActiveSessionForUser(userId, sessionId);
    if (!session) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    await this.fcmTokenRepo.deleteByToken(token);
    await this.fcmTokenRepo.upsertForSession(userId, sessionId, token);
  }

  async deleteBySessionId(sessionId: number): Promise<void> {
    await this.fcmTokenRepo.deleteBySessionId(sessionId);
  }

  async deleteBySessionIds(sessionIds: number[]): Promise<void> {
    await this.fcmTokenRepo.deleteBySessionIds(sessionIds);
  }

  async deleteAllForUser(userId: number): Promise<void> {
    await this.fcmTokenRepo.deleteAllForUser(userId);
  }

  async cleanupOrphanedTokens(): Promise<number> {
    return this.fcmTokenRepo.deleteOrphanedTokens();
  }
}
