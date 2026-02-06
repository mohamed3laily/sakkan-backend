import { pgTable, uuid, varchar } from 'drizzle-orm/pg-core';
import { timestamps } from '../helpers';

export const cities = pgTable('cities', {
  id: uuid('id').defaultRandom().primaryKey(),
  nameEn: varchar('name_en', { length: 100 }).notNull(),
  nameAr: varchar('name_ar', { length: 100 }).notNull(),

  ...timestamps,
});
