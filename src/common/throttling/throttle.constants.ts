export const DEFAULT_THROTTLE = {
  name: 'default',
  ttl: 60_000,
  limit: 300,
} as const;

export const AUTH_THROTTLE = {
  ttl: 60_000,
  limit: 10,
} as const;

export const STRICT_AUTH_THROTTLE = {
  ttl: 60_000,
  limit: 5,
} as const;
