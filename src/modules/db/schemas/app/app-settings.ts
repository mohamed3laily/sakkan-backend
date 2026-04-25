import { pgTable, serial, text, varchar } from 'drizzle-orm/pg-core';

import { timestamps } from '../timestamps';

export type SelectAppSettings = typeof appSettings.$inferSelect;
export type InsertAppSettings = typeof appSettings.$inferInsert;

export const appSettings = pgTable('app_settings', {
  id: serial('id').primaryKey(),
  phones: varchar('phones', { length: 32 }).array().notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  termsAndConditionsEn: text('terms_and_conditions_en').notNull(),
  termsAndConditionsAr: text('terms_and_conditions_ar').notNull(),
  ...timestamps,
});
