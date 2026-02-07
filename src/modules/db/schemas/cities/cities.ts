import { pgTable, serial, varchar } from 'drizzle-orm/pg-core';
import { timestamps } from '../timestamps';
export const cities = pgTable('cities', {
  id: serial('id').primaryKey(),
  nameEn: varchar('name_en', { length: 100 }).notNull(),
  nameAr: varchar('name_ar', { length: 100 }).notNull(),

  ...timestamps,
});
