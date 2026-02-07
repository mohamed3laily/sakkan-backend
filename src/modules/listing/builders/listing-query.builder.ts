import { SQL, and, eq, gte, lte, or, ilike, asc, desc } from 'drizzle-orm';
import { listings } from '../../db/schemas/listing/listing';
import { ListingFiltersDto } from '../dto/listing-filters.dto';
import {
  ListingSortDto,
  ListingSortBy,
  SortOrder,
} from '../dto/listing-sort.dto';

export class ListingQueryBuilder {
  /**
   */
  static buildWhere(filters: ListingFiltersDto): SQL | undefined {
    const conditions: SQL[] = [];

    this.addEqualityCondition(conditions, listings.dealType, filters.dealType);
    this.addEqualityCondition(
      conditions,
      listings.listingType,
      filters.listingType,
    );
    this.addEqualityCondition(
      conditions,
      listings.propertyType,
      filters.propertyType,
    );
    this.addEqualityCondition(conditions, listings.cityId, filters.cityId);
    this.addEqualityCondition(conditions, listings.areaId, filters.areaId);
    this.addEqualityCondition(
      conditions,
      listings.isSerious,
      filters.isSerious,
    );
    this.addEqualityCondition(
      conditions,
      listings.budgetType,
      filters.budgetType,
    );
    this.addEqualityCondition(
      conditions,
      listings.paymentMethod,
      filters.paymentMethod,
    );
    this.addEqualityCondition(
      conditions,
      listings.numberOfRooms,
      filters.numberOfRooms,
    );

    this.addRangeCondition(
      conditions,
      listings.price,
      filters.minPrice,
      filters.maxPrice,
    );
    this.addRangeCondition(
      conditions,
      listings.spaceSqm,
      filters.minSpaceSqm,
      filters.maxSpaceSqm,
    );

    if (filters.keyword?.trim()) {
      const keyword = filters.keyword.trim();
      conditions.push(
        or(
          ilike(listings.title, `%${keyword}%`),
          ilike(listings.description, `%${keyword}%`),
        )!,
      );
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
  }

  static buildOrderBy(sort: ListingSortDto): SQL {
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

  private static addEqualityCondition<T>(
    conditions: SQL[],
    column: any,
    value: T | undefined | null,
  ): void {
    if (value !== undefined && value !== null) {
      conditions.push(eq(column, value));
    }
  }

  private static addRangeCondition(
    conditions: SQL[],
    column: any,
    min: number | undefined | null,
    max: number | undefined | null,
  ): void {
    if (min !== undefined && min !== null) {
      conditions.push(gte(column, min));
    }
    if (max !== undefined && max !== null) {
      conditions.push(lte(column, max));
    }
  }
}
