import { SQL, and, eq, gte, lte, or, ilike, asc, desc, arrayOverlaps } from 'drizzle-orm';
import { ListingFiltersDto } from '../dto/listing-filters.dto';
import { ListingSortDto, ListingSortBy, SortOrder } from '../dto/listing-sort.dto';
import { listings } from 'src/modules/db/schemas/schema-index';

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
    whenDefined(f.id, (v) => eq(listings.id, v)),
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

export function buildListingWhere(filters: ListingFiltersDto) {
  return collect(
    buildBasicFilters(filters),
    buildRangeFilters(filters),
    buildKeywordFilter(filters.keyword),
  );
}

export function buildListingOrderBy(sort: ListingSortDto): SQL {
  const direction = sort.order === SortOrder.ASC ? asc : desc;

  switch (sort.sortBy) {
    case ListingSortBy.PRICE:
      return direction(listings.price);
    case ListingSortBy.SPACE:
      return direction(listings.spaceSqm);
    case ListingSortBy.LISTING_TIER:
      return direction(listings.listingTier);
    case ListingSortBy.CREATED_AT:
    default:
      return direction(listings.createdAt);
  }
}
