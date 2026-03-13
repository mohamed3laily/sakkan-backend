import { SQL, and, eq, gte, lte, or, ilike, asc, desc, arrayOverlaps, sql } from 'drizzle-orm';
import { listings } from '../../../../db/schemas/listing/listing';
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
    whenDefined(f.isSerious, (v) => eq(listings.isSerious, v)),
    whenDefined(f.budgetType, (v) => eq(listings.budgetType, v)),
    whenDefined(f.paymentMethod, (v) => eq(listings.paymentMethod, v)),
    whenDefined(f.numberOfRooms, (v) => eq(listings.numberOfRooms, v)),
    whenArray(f.areaIds, (v) => arrayOverlaps(listings.areaIds, v)),
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

export function buildListingWhere(filters: ListingFiltersDto, userId: number) {
  return collect(
    buildBasicFilters(filters),
    buildRangeFilters(filters),
    buildKeywordFilter(filters.keyword),
    buildFavoritedFilter(filters.favorited, userId),
    whenDefined(userId, (v) => eq(listings.userId, v)),
  );
}

export function buildListingOrderBy(sort: ListingSortDto): SQL {
  const direction = sort.order === SortOrder.ASC ? asc : desc;

  switch (sort.sortBy) {
    case ListingSortBy.PRICE:
      return direction(listings.price);
    case ListingSortBy.SPACE:
      return direction(listings.spaceSqm);
    case ListingSortBy.IS_SERIOUS:
      return direction(listings.isSerious);
    case ListingSortBy.CREATED_AT:
    default:
      return direction(listings.createdAt);
  }
}
