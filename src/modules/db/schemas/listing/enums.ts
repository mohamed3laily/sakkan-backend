import { pgEnum } from 'drizzle-orm/pg-core';

export const dealTypeEnum = pgEnum('deal_type', ['RENT', 'BUY']);

export const listingTypeEnum = pgEnum('listing_type', ['OFFER', 'REQUEST']);

export const propertyTypeEnum = pgEnum('property_type', [
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
