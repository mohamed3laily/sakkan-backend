import {
  boolean,
  doublePrecision,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import {
  budgetTypeEnum,
  dealTypeEnum,
  listingQuotaSourceEnum,
  listingStatusEnum,
  listingTierEnum,
  listingTypeEnum,
  paymentMethodEnum,
} from './enums';
import { payments } from '../monetization/payments';
import { propertyType, users } from '../schema-index';
import { cities } from '../cities/cities';

import { index } from 'drizzle-orm/pg-core';
import { timestamps } from '../timestamps';
import { developersProjects } from '../real-state-developers/developers-projects';

export const listings = pgTable(
  'listings',
  {
    id: serial('id').primaryKey(),
    title: varchar('title'),
    description: text('description'),
    userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
    dealType: dealTypeEnum('deal_type').notNull(),
    listingType: listingTypeEnum('listing_type').notNull(),
    propertyTypeId: integer('property_type_id').references(() => propertyType.id),
    cityId: integer('city_id').notNull().references(() => cities.id),
    areaIds: integer('area_ids').array(),
    agentId: integer('agent_id').references(() => users.id, { onDelete: 'cascade' }),
    budgetType: budgetTypeEnum('budget_type').notNull(),
    price: integer('price'),
    mPrice: integer('m_price'),
    spaceSqm: integer('space_sqm'),
    numberOfRooms: integer('number_of_rooms'),
    numberOfBathrooms: integer('number_of_bathrooms'),
    numberOfUnits: integer('number_of_units'),
    propertyAge: integer('property_age'),
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
    paymentMethod: paymentMethodEnum('payment_method'),
    developerPaymentMethods: paymentMethodEnum('developer_payment_methods').array(),
    contactWhatsapp: boolean('contact_whatsapp').default(true),
    contactPhone: boolean('contact_phone').default(false),
    status: listingStatusEnum('status').default('PUBLISHED'),
    listingTier: listingTierEnum('listing_tier').default('standard'),
    premiumExpiresAt: timestamp('premium_expires_at', {withTimezone: true,mode: 'string'}),
    monetizationPaymentId: integer('monetization_payment_id').references(() => payments.id),
    quotaSource: listingQuotaSourceEnum('quota_source'),
    projectId: integer('project_id').references(() => developersProjects.id),
    deliveryDate: timestamp('delivery_date'),
    ...timestamps,
  },
  (table) => ({
    cityIdx: index('idx_property_listings_city').on(table.cityId),
    areaIdsIdx: index('idx_property_listings_area_ids').using('gin', table.areaIds),
    propertyTypeIdx: index('idx_listings_property_type').on(table.propertyTypeId),
    priceIdx: index('idx_property_listings_price').on(table.price),
    userIdx: index('idx_property_listings_user').on(table.userId),
    createdAtIdx: index('idx_property_listings_created_at').on(table.createdAt),
    projectIdIdx: index('idx_property_listings_project_id').on(table.projectId),
    cityDealListingIdx: index('idx_property_listings_city_deal_listing').on(
      table.cityId,
      table.dealType,
      table.listingType,
    ),
  }),
);
