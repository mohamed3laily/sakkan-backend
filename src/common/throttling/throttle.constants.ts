export const AUTH_THROTTLE = {
  name: 'auth',
  ttl: 60_000,
  limit: 10,
} as const;

export const STRICT_AUTH_THROTTLE = {
  name: 'auth',
  ttl: 60_000,
  limit: 5,
} as const;
