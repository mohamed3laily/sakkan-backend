import { doublePrecision, integer, jsonb, pgTable, serial, varchar } from 'drizzle-orm/pg-core';
import { cities } from './cities';
import { timestamps } from '../timestamps';

export const areas = pgTable('areas', {
  id: serial('id').primaryKey(),
  cityId: integer('city_id')
    .notNull()
    .references(() => cities.id, { onDelete: 'cascade' }),

  nameEn: varchar('name_en', { length: 150 }).notNull(),
  nameAr: varchar('name_ar', { length: 150 }).notNull(),
  latitude: doublePrecision('latitude'),
  longitude: doublePrecision('longitude'),
  geometry: jsonb('geometry'),

  ...timestamps,
});
