import { pgTable, serial, text, varchar } from 'drizzle-orm/pg-core';

import { timestamps } from '../timestamps';

export type SelectAppSettings = typeof appSettings.$inferSelect;
export type InsertAppSettings = typeof appSettings.$inferInsert;

export const appSettings = pgTable('app_settings', {
  id: serial('id').primaryKey(),
  phones: varchar('phones', { length: 32 }).array().notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  termsAndConditions: text('terms_and_conditions').notNull(),
  ...timestamps,
});
