import { pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';

import { timestamps } from '../timestamps';
import { adminTypeEnum } from './enums';

export type SelectAdmin = typeof admins.$inferSelect;
export type InsertAdmin = typeof admins.$inferInsert;
export type AdminType = (typeof adminTypeEnum.enumValues)[number];

export const admins = pgTable('admins', {
  id: serial('id').primaryKey(),
  name: varchar('name').notNull(),
  phone: varchar('phone').notNull().unique(),
  password: varchar('password').notNull(),
  type: adminTypeEnum('type').notNull().default('admin'),
  revokedAt: timestamp('revoked_at', { withTimezone: true, mode: 'string' }),
  passwordResetToken: text('password_reset_token'),
  passwordResetTokenExpiry: timestamp('password_reset_token_expiry'),
  ...timestamps,
});
