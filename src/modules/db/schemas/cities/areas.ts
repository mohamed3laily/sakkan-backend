import { pgTable, serial, uuid, varchar } from 'drizzle-orm/pg-core';
import { cities } from './cities';
import { timestamps } from '../helpers';

export const areas = pgTable('areas', {
  id: serial('id').primaryKey(),
  cityId: uuid('city_id')
    .notNull()
    .references(() => cities.id, { onDelete: 'cascade' }),

  nameEn: varchar('name_en', { length: 150 }).notNull(),
  nameAr: varchar('name_ar', { length: 150 }).notNull(),

  ...timestamps,
});
