import { Injectable } from '@nestjs/common';
import { CreateListingDto } from './dto/create-listing.dto';
import { DrizzleService } from '../db/drizzle.service';
import { listings } from '../db/schemas/listing/listing';
import { and, asc, desc, eq, gte, ilike, lte, or, SQL } from 'drizzle-orm';
import { ListingFiltersDto } from './dto/listing-filters.dto';
import {
  ListingSortBy,
  ListingSortDto,
  SortOrder,
} from './dto/listing-sort.dto';

@Injectable()
export class ListingsRepository {
  constructor(private readonly drizzleService: DrizzleService) {}
  async create(userId: number, dto: CreateListingDto) {
    const [listing] = await this.drizzleService.db
      .insert(listings)
      .values({
        userId,
        title: dto.title,
        dealType: dto.dealType,
        listingType: dto.listingType,
        propertyType: dto.propertyType,
        cityId: dto.cityId,
        areaId: dto.areaId,
        budgetType: dto.budgetType,
        price: dto.price,
        spaceSqm: dto.spaceSqm,
        numberOfRooms: dto.numberOfRooms,
        numberOfBathrooms: dto.numberOfBathrooms,
        paymentMethod: dto.paymentMethod,
        description: dto.description,
        contactWhatsapp: dto.contactWhatsapp,
        contactPhone: dto.contactPhone,
        isSerious: dto.isSerious,
      })
      .returning();

    return listing;
  }

  async findAll(filters: ListingFiltersDto, sort: ListingSortDto) {
    const whereClause = this.buildWhere(filters);
    const orderByClause = this.buildOrderBy(sort);
    return this.drizzleService.db
      .select()
      .from(listings)
      .where(whereClause)
      .orderBy(orderByClause);
  }

  private buildWhere(filters: ListingFiltersDto): SQL | undefined {
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

    // Keyword search
    if (filters.keyword?.trim()) {
      const keyword = filters.keyword.trim();

      const keywordCondition: SQL = or(
        ilike(listings.title, `%${keyword}%`),
        ilike(listings.description, `%${keyword}%`),
      )!;

      conditions.push(keywordCondition);
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
  }

  private buildOrderBy(sort: ListingSortDto): SQL {
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

  private addEqualityCondition<T>(
    conditions: SQL[],
    column: any,
    value: T | undefined | null,
  ): void {
    if (value !== undefined && value !== null) {
      conditions.push(eq(column, value));
    }
  }

  private addRangeCondition(
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
