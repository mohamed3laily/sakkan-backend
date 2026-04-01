import { doublePrecision, integer, pgTable, serial, varchar } from 'drizzle-orm/pg-core';
import { timestamps } from '../timestamps';
export const cities = pgTable('cities', {
  id: serial('id').primaryKey(),
  nameEn: varchar('name_en', { length: 100 }).notNull().unique(),
  nameAr: varchar('name_ar', { length: 100 }).notNull(),
  listingCount: integer('listing_count').default(0),
  latitude: doublePrecision('latitude'),
  longitude: doublePrecision('longitude'),

  ...timestamps,
});
