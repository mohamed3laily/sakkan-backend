export const QUEUES = {
  CITY: 'city',
  ATTACHMENT: 'attachment',
} as const;

export const CITY_JOBS = {
  INCREMENT_LISTING_COUNT: 'increment-listing-count',
} as const;

export const ATTACHMENT_JOBS = {
  CLEANUP_ORPHANS: 'cleanup-orphans',
} as const;
