import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { DrizzleService } from '../../db/drizzle.service';
import { seriousRequestUnlocks } from '../../db/schemas/monetization/serious-request-unlocks';
import type { AppTransaction } from '../monetization-db.types';

/**
 * All reads and writes against serious_request_unlocks live here.
 * Both the quota service (write path) and the contact-gate interceptor
 * (read path) depend on this — one place to change if the table moves.
 */
@Injectable()
export class SeriousRequestUnlockRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async isUnlocked(listingId: number, userId: number): Promise<boolean> {
    const rows = await this.drizzle.db
      .select({ id: seriousRequestUnlocks.id })
      .from(seriousRequestUnlocks)
      .where(
        and(
          eq(seriousRequestUnlocks.userId, userId),
          eq(seriousRequestUnlocks.listingId, listingId),
        ),
      )
      .limit(1);

    return rows.length > 0;
  }

  async isUnlockedTx(tx: AppTransaction, listingId: number, userId: number): Promise<boolean> {
    const rows = await tx
      .select({ id: seriousRequestUnlocks.id })
      .from(seriousRequestUnlocks)
      .where(
        and(
          eq(seriousRequestUnlocks.userId, userId),
          eq(seriousRequestUnlocks.listingId, listingId),
        ),
      )
      .limit(1);

    return rows.length > 0;
  }

  async createUnlockTx(tx: AppTransaction, listingId: number, userId: number): Promise<void> {
    await tx.insert(seriousRequestUnlocks).values({ userId, listingId });
  }
}
