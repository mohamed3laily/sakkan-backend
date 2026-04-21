import { boolean, integer, pgTable, serial, varchar } from 'drizzle-orm/pg-core';

import { timestamps } from '../timestamps';
import { creditTypeEnum } from './enums';

export const creditProducts = pgTable('credit_products', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 50 }).notNull().unique(),
  displayNameEn: varchar('display_name_en', { length: 100 }).notNull(),
  displayNameAr: varchar('display_name_ar', { length: 100 }).notNull(),
  creditType: creditTypeEnum('credit_type').notNull(),
  credits: integer('credits').notNull(),
  priceEgp: integer('price_egp').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  ...timestamps,
});
