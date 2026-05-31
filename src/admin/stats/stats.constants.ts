export const STATS_OVERVIEW_CACHE_TTL_SECONDS = 4 * 60 * 60;

export const statsOverviewCacheKey = (months: number) => `admin:stats:overview:${months}`;
