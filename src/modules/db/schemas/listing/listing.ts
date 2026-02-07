import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  varchar,
} from 'drizzle-orm/pg-core';
import {
  budgetTypeEnum,
  dealTypeEnum,
  listingTypeEnum,
  paymentMethodEnum,
  propertyTypeEnum,
} from './enums';
import { users } from '../schema-index';
import { cities } from '../cities/cities';
import { areas } from '../cities/areas';

import { index } from 'drizzle-orm/pg-core';
import { timestamps } from '../timestamps';

export const listings = pgTable(
  'listings',
  {
    id: serial('id').primaryKey(),
    title: varchar('title'),
    description: text('description'),

    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),

    dealType: dealTypeEnum('deal_type').notNull(),
    listingType: listingTypeEnum('listing_type').notNull(),
    propertyType: propertyTypeEnum('property_type').notNull(),

    cityId: integer('city_id')
      .notNull()
      .references(() => cities.id),

    areaId: integer('area_id').references(() => areas.id),

    budgetType: budgetTypeEnum('budget_type').notNull(),
    price: integer('price'),
    mPrice: integer('m_price'),
    spaceSqm: integer('space_sqm'),
    numberOfRooms: integer('number_of_rooms'),
    numberOfBathrooms: integer('number_of_bathrooms'),
    propertyAge: integer('property_age'),
    latitude: integer('latitude'),
    longitude: integer('longitude'),
    paymentMethod: paymentMethodEnum('payment_method'),

    contactWhatsapp: boolean('contact_whatsapp').default(true),
    contactPhone: boolean('contact_phone').default(false),
    isSerious: boolean('is_serious').default(false),
    ...timestamps,
  },
  (table) => ({
    cityIdx: index('idx_property_listings_city').on(table.cityId),
    areaIdx: index('idx_property_listings_area').on(table.areaId),

    propertyTypeIdx: index('idx_property_listings_property_type').on(
      table.propertyType,
    ),

    priceIdx: index('idx_property_listings_price').on(table.price),

    userIdx: index('idx_property_listings_user').on(table.userId),

    createdAtIdx: index('idx_property_listings_created_at').on(table.createdAt),

    cityDealListingIdx: index('idx_property_listings_city_deal_listing').on(
      table.cityId,
      table.dealType,
      table.listingType,
    ),
  }),
);
