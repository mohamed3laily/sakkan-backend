import { pgTable, serial, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { timestamps } from '../timestamps';

export type SelectAdmin = typeof admins.$inferSelect;
export type InsertAdmin = typeof admins.$inferInsert;

export const admins = pgTable('admins', {
  id: serial('id').primaryKey(),
  name: varchar('name').notNull(),
  phone: varchar('phone').notNull().unique(),
  password: varchar('password').notNull(),
  passwordResetToken: text('password_reset_token'),
  passwordResetTokenExpiry: timestamp('password_reset_token_expiry'),
  ...timestamps,
});
