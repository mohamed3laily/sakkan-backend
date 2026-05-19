import {
  doublePrecision,
  index,
  integer,
  pgTable,
  real,
  serial,
  text,
  varchar
} from 'drizzle-orm/pg-core';
import { timestamps } from '../timestamps';
import { realEstateDevelopers } from './real-estate-developers';
import { cities } from '../cities/cities';
import { areas } from '../schema-index';

export const developersProjects = pgTable(
  'developers_projects',
  {
    id: serial('id').primaryKey(),
    developerId: integer('developer_id')
      .references(() => realEstateDevelopers.id, { onDelete: 'cascade' })
      .notNull(),
    nameEn: text('name_en'),
    nameAr: text('name_ar'),

    descriptionEn: text('description_en'),
    descriptionAr: text('description_ar'),
    addressEn: text('address_en'),
    addressAr: text('address_ar'),
    cityId: integer('city_id')
      .references(() => cities.id, { onDelete: 'set null' })
      .notNull(),
    areaId: integer('area_id').references(() => areas.id, { onDelete: 'set null' }),
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
    priceStartingFrom: integer('price_starting_from'),
    commissionPercentage: real('commission_percentage'),
    phone: varchar('phone'),
    whatsappPhone: varchar('whatsapp_phone'),
    ...timestamps,
  },
  (table) => [
    index('idx_developers_projects_developer_id').on(table.developerId),
    index('idx_developers_projects_city_id').on(table.cityId),
  ],
);
