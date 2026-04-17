import { Injectable, Logger } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';

import { DrizzleService } from '../../db/drizzle.service';
import { oneTimeCredits } from '../../db/schemas/monetization/one-time-credits';
import type { CreditType } from '../types';

export const CREDIT_PRICES = {
  serious_single: { egp: 99, credits: 1, type: 'serious' as CreditType },
  featured_single: { egp: 99, credits: 1, type: 'featured' as CreditType },
  featured_bundle: { egp: 999, credits: 15, type: 'featured' as CreditType },
} as const;

export type CreditProduct = keyof typeof CREDIT_PRICES;

@Injectable()
export class CreditsService {
  private readonly logger = new Logger(CreditsService.name);

  constructor(private readonly drizzle: DrizzleService) {}

  async addCredits(
    userId: number,
    type: CreditType,
    amount: number,
    paymentId: number,
  ): Promise<{ newBalance: number }> {
    const result = await this.drizzle.db
      .insert(oneTimeCredits)
      .values({
        userId,
        type,
        totalCredits: amount,
        usedCredits: 0,
      })
      .onConflictDoUpdate({
        target: [oneTimeCredits.userId, oneTimeCredits.type],
        set: {
          totalCredits: sql`${oneTimeCredits.totalCredits} + ${amount}`,
          updatedAt: new Date().toISOString(),
        },
      })
      .returning();

    const row = result[0];
    const newBalance = row.totalCredits - row.usedCredits;

    this.logger.log(
      `Credits added: user=${userId} type=${type} amount=${amount} paymentId=${paymentId} newBalance=${newBalance}`,
    );

    return { newBalance };
  }

  async getBalance(userId: number, type: CreditType) {
    const rows = await this.drizzle.db
      .select()
      .from(oneTimeCredits)
      .where(and(eq(oneTimeCredits.userId, userId), eq(oneTimeCredits.type, type)))
      .limit(1);

    if (!rows[0]) {
      return { total: 0, used: 0, available: 0 };
    }

    const { totalCredits, usedCredits } = rows[0];
    return {
      total: totalCredits,
      used: usedCredits,
      available: Math.max(0, totalCredits - usedCredits),
    };
  }

  async getAllBalances(userId: number) {
    const rows = await this.drizzle.db
      .select()
      .from(oneTimeCredits)
      .where(eq(oneTimeCredits.userId, userId));

    const result: Record<CreditType, number> = { serious: 0, featured: 0 };
    for (const row of rows) {
      result[row.type] = Math.max(0, row.totalCredits - row.usedCredits);
    }
    return result;
  }

  getPricing(product: CreditProduct) {
    return CREDIT_PRICES[product];
  }
}
