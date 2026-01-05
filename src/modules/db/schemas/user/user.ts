import { pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { timestamps } from '../timestamps';

export type SelectUser = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  firstName: varchar('first_name').notNull(),
  lastName: varchar('last_name').notNull(),
  phone: varchar('phone').notNull().unique(),
  password: varchar('password').notNull(),
  resetToken: text('reset_token'),
  resetTokenExpiry: timestamp('reset_token_expiry'),
  ...timestamps,
});
