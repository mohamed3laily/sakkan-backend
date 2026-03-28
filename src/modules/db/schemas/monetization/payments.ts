import { index, integer, jsonb, pgTable, serial, varchar } from 'drizzle-orm/pg-core';
import { paymentStatusEnum, paymentTypeEnum } from './enums';
import { users } from '../schema-index';
import { timestamps } from '../timestamps';

export const payments = pgTable(
  'payments',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: paymentTypeEnum('type').notNull(),
    status: paymentStatusEnum('status').notNull().default('pending'),
    amountPiasters: integer('amount_piasters').notNull(),
    paymobOrderId: varchar('paymob_order_id', { length: 255 }),
    paymobTransactionId: varchar('paymob_transaction_id', { length: 255 }),
    paymobPaymentKey: varchar('paymob_payment_key', { length: 1000 }),
    metadata: jsonb('metadata'),
    ...timestamps,
  },
  (table) => ({
    userIdx: index('idx_payments_user').on(table.userId),
  }),
);
