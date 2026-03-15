import { pgEnum } from 'drizzle-orm/pg-core';

export const reviewableTypeEnum = pgEnum('reviewable_type', ['USER']);

export type ReviewableType = 'USER';

export const reviewServiceTypeEnum = pgEnum('review_service_type', [
  'PROPERTY_REQUEST_SERVICE',
  'PROPERTY_LISTING_SERVICE',
  'PROPERTY_MARKETING_SERVICE',
]);

export type ReviewServiceType =
  | 'PROPERTY_REQUEST_SERVICE'
  | 'PROPERTY_LISTING_SERVICE'
  | 'PROPERTY_MARKETING_SERVICE';
