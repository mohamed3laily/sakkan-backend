import { pgEnum } from 'drizzle-orm/pg-core';

export const dealTypeEnum = pgEnum('deal_type', ['RENT', 'BUY']);

export const listingTypeEnum = pgEnum('listing_type', ['OFFER', 'REQUEST']);

export const propertyParentTypeEnum = pgEnum('property_parents_type', [
  'LAND',
  'VILLA_PALACE',
  'APARTMENT_ROOM',
  'FLOOR',
  'BUILDING_TOWER',
  'SHOP_SHOWROOM',
  'CHALET_RESORT',
  'FARM_YARD',
  'COMMERCIAL_SERVICE',
  'INDUSTRIAL_LOGISTICS',
]);

export const budgetTypeEnum = pgEnum('budget_type', ['MARKET', 'FIXED']);
export const paymentMethodEnum = pgEnum('payment_method', ['CASH', 'OTHER']);

export const listingStatusEnum = pgEnum('listing_status', ['PUBLISHED', 'UNLISTED', 'PENDING']);
