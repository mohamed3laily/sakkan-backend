import { pgEnum } from 'drizzle-orm/pg-core';

export const dealTypeEnum = pgEnum('deal_type', ['RENT', 'BUY']);

export const listingTypeEnum = pgEnum('listing_type', ['OFFER', 'REQUEST']);

export const propertyTypeEnum = pgEnum('property_type', [
  'LAND',
  'VILLA_PALACE',
  'FLOOR',
  'BUILDING_TOWER',
  'APARTMENT_ROOM',
]);

export const budgetTypeEnum = pgEnum('budget_type', ['MARKET', 'FIXED']);
export const paymentMethodEnum = pgEnum('payment_method', ['CASH', 'OTHER']);
