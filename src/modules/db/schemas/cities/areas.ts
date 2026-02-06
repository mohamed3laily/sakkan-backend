import { integer, pgTable, serial, uuid, varchar } from 'drizzle-orm/pg-core';
import { cities } from './cities';
import { timestamps } from '../timestamps';

export const areas = pgTable('areas', {
  id: serial('id').primaryKey(),
  cityId: integer('city_id')
    .notNull()
    .references(() => cities.id, { onDelete: 'cascade' }),

  nameEn: varchar('name_en', { length: 150 }).notNull(),
  nameAr: varchar('name_ar', { length: 150 }).notNull(),

  ...timestamps,
});
