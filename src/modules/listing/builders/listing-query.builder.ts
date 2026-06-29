import {
  SQL,
  and,
  eq,
  gte,
  lte,
  or,
  ilike,
  asc,
  desc,
  arrayOverlaps,
  isNull,
  sql,
} from 'drizzle-orm';
import { listings } from '../../db/schemas/listing/listing';
import { ListingFiltersDto } from '../dto/listing-filters.dto';
import { ListingSortDto, ListingSortBy, SortOrder } from '../dto/listing-sort.dto';

// ----helpers ----

function whenDefined<T>(value: T | undefined | null, fn: (v: T) => SQL): SQL | undefined {
  return value !== undefined && value !== null ? fn(value) : undefined;
}

function whenArray<T>(value: T[] | undefined | null, fn: (v: T[]) => SQL): SQL | undefined {
  return value?.length ? fn(value) : undefined;
}

function collect(...conditions: (SQL | undefined)[]): SQL | undefined {
  const defined = conditions.filter(Boolean) as SQL[];
  return defined.length ? and(...defined) : undefined;
}

// ---- filter builders ----

function buildBasicFilters(f: ListingFiltersDto) {
  return collect(
    whenDefined(f.dealType, (v) => eq(listings.dealType, v)),
    whenDefined(f.listingType, (v) => eq(listings.listingType, v)),
    whenDefined(f.propertyTypeId, (v) => eq(listings.propertyTypeId, v)),
    whenDefined(f.cityId, (v) => eq(listings.cityId, v)),
    whenDefined(f.listingTier, (v) => eq(listings.listingTier, v)),
    whenDefined(f.budgetType, (v) => eq(listings.budgetType, v)),
    whenDefined(f.paymentMethod, (v) => eq(listings.paymentMethod, v)),
    whenDefined(f.numberOfRooms, (v) => eq(listings.numberOfRooms, v)),
    whenArray(f.areaIds, (v) => arrayOverlaps(listings.areaIds, v)),
    whenDefined(f.userId, (v) => eq(listings.userId, v)),
  );
}

function buildRangeFilters(f: ListingFiltersDto) {
  return collect(
    whenDefined(f.minPrice, (v) => gte(listings.price, v)),
    whenDefined(f.maxPrice, (v) => lte(listings.price, v)),
    whenDefined(f.minSpaceSqm, (v) => gte(listings.spaceSqm, v)),
    whenDefined(f.maxSpaceSqm, (v) => lte(listings.spaceSqm, v)),
  );
}

function buildKeywordFilter(keyword?: string) {
  const trimmed = keyword?.trim();
  if (!trimmed) return undefined;
  return or(ilike(listings.title, `%${trimmed}%`), ilike(listings.description, `%${trimmed}%`));
}

function buildFavoritedFilter(favorited?: boolean, userId?: number) {
  if (!favorited || !userId) return undefined;
  return sql`EXISTS (
    SELECT 1 FROM favorites
    WHERE favorites.user_id = ${userId}
      AND favorites.favoritable_type = 'LISTING'
      AND favorites.favoritable_id = ${listings.id}
  )`;
}

function buildAgentPreferenceFilter(f: ListingFiltersDto, userId?: number) {
  if (!f.matchMyPreferences || !userId) return undefined;

  return or(
    eq(listings.agentId, userId),
    sql`${listings.propertyTypeId} IN (
      SELECT preferable_id FROM preferences
      WHERE user_id = ${userId}
        AND preferable_type = 'PROPERTY_TYPE'
    )`,
    sql`EXISTS (
      SELECT 1 FROM preferences
      WHERE user_id = ${userId}
        AND preferable_type = 'AREA'
        AND preferable_id = ANY(${listings.areaIds})
    )`,
  );
}

export function buildListingWhere(filters: ListingFiltersDto, userId?: number) {
  return collect(
    isNull(listings.projectId),
    buildBasicFilters(filters),
    buildRangeFilters(filters),
    buildKeywordFilter(filters.keyword),
    buildFavoritedFilter(filters.favorited, userId),
    buildAgentPreferenceFilter(filters, userId),
  );
}

export function buildListingOrderBy(sort: ListingSortDto): SQL[] {
  const direction = sort.order === SortOrder.ASC ? asc : desc;

  let userSort: SQL;
  switch (sort.sortBy) {
    case ListingSortBy.PRICE:
      userSort = direction(listings.price);
      break;
    case ListingSortBy.SPACE:
      userSort = direction(listings.spaceSqm);
      break;
    case ListingSortBy.LISTING_TIER:
      userSort = direction(listings.listingTier);
      break;
    case ListingSortBy.CREATED_AT:
    default:
      userSort = direction(listings.createdAt);
      break;
  }

  return [desc(listings.listingTier), userSort];
}
