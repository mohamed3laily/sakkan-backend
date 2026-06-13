import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { DrizzleService } from '../../db/drizzle.service';
import { payments } from '../../db/schemas/monetization/payments';
import { subscriptionPlans } from '../../db/schemas/monetization/subscription-plans';
import { creditProducts } from '../../db/schemas/monetization/credit-products';
import { userSubscriptions } from '../../db/schemas/monetization/user-subscriptions';
import type { AppTransaction } from '../monetization-db.types';

export type PaymentRow = typeof payments.$inferSelect;

@Injectable()
export class AppleIAPRepo {
  constructor(private readonly drizzle: DrizzleService) {}

  async findPaymentByAppleTransactionId(appleTransactionId: string): Promise<PaymentRow | null> {
    const rows = await this.drizzle.db
      .select()
      .from(payments)
      .where(eq(payments.appleTransactionId, appleTransactionId))
      .limit(1);
    return rows[0] ?? null;
  }

  async insertPayment(values: typeof payments.$inferInsert): Promise<PaymentRow> {
    const [row] = await this.drizzle.db.insert(payments).values(values).returning();
    return row;
  }

  /**
   * Runs `fulfill` inside a transaction, then marks the payment as success.
   * Skips silently if the payment is no longer pending (idempotency guard).
   */
  async finalizePayment(
    paymentId: number,
    fulfill: (tx: AppTransaction) => Promise<void>,
  ): Promise<void> {
    await this.drizzle.db.transaction(async (tx) => {
      const rows = await tx.select().from(payments).where(eq(payments.id, paymentId)).for('update');
      const p = rows[0];
      if (!p || p.status !== 'pending') return;

      await fulfill(tx);

      await tx
        .update(payments)
        .set({ status: 'success', updatedAt: new Date().toISOString() })
        .where(eq(payments.id, paymentId));
    });
  }

  async markPaymentRefunded(paymentId: number): Promise<void> {
    await this.drizzle.db
      .update(payments)
      .set({ status: 'refunded', updatedAt: new Date().toISOString() })
      .where(eq(payments.id, paymentId));
  }

  async expireUserSubscription(userId: number): Promise<void> {
    await this.drizzle.db
      .update(userSubscriptions)
      .set({ status: 'expired', updatedAt: new Date().toISOString() })
      .where(eq(userSubscriptions.userId, userId));
  }

  async findPlanByAppleProductId(productId: string) {
    const rows = await this.drizzle.db
      .select()
      .from(subscriptionPlans)
      .where(
        and(eq(subscriptionPlans.appleProductId, productId), eq(subscriptionPlans.isActive, true)),
      )
      .limit(1);
    return rows[0] ?? null;
  }

  async findCreditProductByAppleProductId(productId: string) {
    const rows = await this.drizzle.db
      .select()
      .from(creditProducts)
      .where(and(eq(creditProducts.appleProductId, productId), eq(creditProducts.isActive, true)))
      .limit(1);
    return rows[0] ?? null;
  }
}
