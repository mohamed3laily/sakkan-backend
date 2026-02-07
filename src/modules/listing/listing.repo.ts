import { Injectable } from '@nestjs/common';
import { CreateListingDto } from './dto/create-listing.dto';
import { DrizzleService } from '../db/drizzle.service';
import { listings } from '../db/schemas/listing/listing';
import { cities } from '../db/schemas/cities/cities';
import { areas } from '../db/schemas/cities/areas';
import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  lte,
  or,
  SQL,
  count,
} from 'drizzle-orm';
import { ListingFiltersDto } from './dto/listing-filters.dto';
import {
  ListingSortBy,
  ListingSortDto,
  SortOrder,
} from './dto/listing-sort.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export interface FindAllResult {
  data: any[];
  total: number;
}

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
        mPrice: dto.mPrice,
        latitude: dto.latitude,
        longitude: dto.longitude,
        propertyAge: dto.propertyAge,
        contactWhatsapp: dto.contactWhatsapp,
        contactPhone: dto.contactPhone,
        isSerious: dto.isSerious,
      })
      .returning();

    return listing;
  }

  async findAll(
    filters: ListingFiltersDto,
    sort: ListingSortDto,
    pagination: PaginationDto,
  ): Promise<FindAllResult> {
    const whereClause = this.buildWhere(filters);
    const orderByClause = this.buildOrderBy(sort);
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    const [data, [{ total }]] = await Promise.all([
      this.drizzleService.db
        .select({
          id: listings.id,
          title: listings.title,
          description: listings.description,
          userId: listings.userId,
          dealType: listings.dealType,
          listingType: listings.listingType,
          propertyType: listings.propertyType,
          budgetType: listings.budgetType,
          price: listings.price,
          spaceSqm: listings.spaceSqm,
          numberOfRooms: listings.numberOfRooms,
          numberOfBathrooms: listings.numberOfBathrooms,
          latitude: listings.latitude,
          longitude: listings.longitude,
          mPrice: listings.mPrice,
          propertyAge: listings.propertyAge,
          paymentMethod: listings.paymentMethod,
          contactWhatsapp: listings.contactWhatsapp,
          contactPhone: listings.contactPhone,
          isSerious: listings.isSerious,
          createdAt: listings.createdAt,

          city: {
            id: cities.id,
            nameEn: cities.nameEn,
            nameAr: cities.nameAr,
          },

          area: {
            id: areas.id,
            nameEn: areas.nameEn,
            nameAr: areas.nameAr,
            cityId: areas.cityId,
          },
        })
        .from(listings)
        .leftJoin(cities, eq(listings.cityId, cities.id))
        .leftJoin(areas, eq(listings.areaId, areas.id))
        .where(whereClause)
        .orderBy(orderByClause)
        .limit(limit)
        .offset(offset),

      this.drizzleService.db
        .select({ total: count() })
        .from(listings)
        .where(whereClause),
    ]);

    return {
      data,
      total: Number(total),
    };
  }

  async findById(id: number) {
    const [listing] = await this.drizzleService.db
      .select({
        id: listings.id,
        title: listings.title,
        description: listings.description,
        userId: listings.userId,
        dealType: listings.dealType,
        listingType: listings.listingType,
        propertyType: listings.propertyType,
        cityId: listings.cityId,
        areaId: listings.areaId,
        budgetType: listings.budgetType,
        price: listings.price,
        spaceSqm: listings.spaceSqm,
        numberOfRooms: listings.numberOfRooms,
        numberOfBathrooms: listings.numberOfBathrooms,
        latitude: listings.latitude,
        longitude: listings.longitude,
        mPrice: listings.mPrice,
        propertyAge: listings.propertyAge,
        paymentMethod: listings.paymentMethod,
        contactWhatsapp: listings.contactWhatsapp,
        contactPhone: listings.contactPhone,
        isSerious: listings.isSerious,
        createdAt: listings.createdAt,

        city: {
          id: cities.id,
          nameEn: cities.nameEn,
          nameAr: cities.nameAr,
        },

        area: {
          id: areas.id,
          nameEn: areas.nameEn,
          nameAr: areas.nameAr,
          cityId: areas.cityId,
        },
      })
      .from(listings)
      .leftJoin(cities, eq(listings.cityId, cities.id))
      .leftJoin(areas, eq(listings.areaId, areas.id))
      .where(eq(listings.id, id))
      .limit(1);

    return listing || null;
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
