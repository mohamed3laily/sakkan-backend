import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { and, asc, eq, sql } from 'drizzle-orm';

import { DrizzleService } from '../../db/drizzle.service';
import { creditProducts } from '../../db/schemas/monetization/credit-products';
import { oneTimeCredits } from '../../db/schemas/monetization/one-time-credits';
import type { CreditType } from '../types';

export type CreditProductRow = typeof creditProducts.$inferSelect;

@Injectable()
export class CreditsService {
  private readonly logger = new Logger(CreditsService.name);

  constructor(private readonly drizzle: DrizzleService) {}

  async getProduct(key: string): Promise<CreditProductRow> {
    const rows = await this.drizzle.db
      .select()
      .from(creditProducts)
      .where(and(eq(creditProducts.key, key), eq(creditProducts.isActive, true)))
      .limit(1);

    if (!rows[0]) {
      throw new NotFoundException('CREDIT_PRODUCT_NOT_FOUND');
    }

    return rows[0];
  }

  async getActiveProducts() {
    return this.drizzle.db
      .select({
        id: creditProducts.id,
        key: creditProducts.key,
        displayNameEn: creditProducts.displayNameEn,
        displayNameAr: creditProducts.displayNameAr,
        creditType: creditProducts.creditType,
        credits: creditProducts.credits,
        priceEgp: creditProducts.priceEgp,
        isActive: creditProducts.isActive,
        sortOrder: creditProducts.sortOrder,
      })
      .from(creditProducts)
      .where(eq(creditProducts.isActive, true))
      .orderBy(asc(creditProducts.sortOrder));
  }

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
}
