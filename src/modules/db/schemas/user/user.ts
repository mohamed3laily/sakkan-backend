import { pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { timestamps } from '../timestamps';
import { userTypeEnum } from './enums';

export type SelectUser = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  firstName: varchar('first_name').notNull(),
  lastName: varchar('last_name').notNull(),
  phone: varchar('phone').notNull().unique(),
  profilePicture: text('profile_picture'),
  type: userTypeEnum('type'),
  verifyPhoneToken: varchar('verify_phone_token'),
  verifyPhoneTokenExpiry: timestamp('verify_phone_token_expiry'),
  verifiedPhoneAt: timestamp('verified_phone_at'),
  password: varchar('password').notNull(),
  resetToken: text('reset_token'),
  resetTokenExpiry: timestamp('reset_token_expiry'),
  ...timestamps,
});
