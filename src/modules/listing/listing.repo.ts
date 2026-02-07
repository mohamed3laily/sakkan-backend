// listing.repo.ts
import { Injectable } from '@nestjs/common';
import { CreateListingDto } from './dto/create-listing.dto';
import { DrizzleService } from '../db/drizzle.service';
import { listings } from '../db/schemas/listing/listing';
import { cities } from '../db/schemas/cities/cities';
import { areas } from '../db/schemas/cities/areas';
import { eq, count } from 'drizzle-orm';
import { ListingFiltersDto } from './dto/listing-filters.dto';
import { ListingSortDto } from './dto/listing-sort.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ListingQueryBuilder } from './builders/listing-query.builder';
import { ListingSelectBuilder } from './builders/listing-select.builder';

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
  ) {
    const whereClause = ListingQueryBuilder.buildWhere(filters);
    const orderByClause = ListingQueryBuilder.buildOrderBy(sort);
    const selectFields = ListingSelectBuilder.getSelectFields();

    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    const [data, [{ total }]] = await Promise.all([
      this.drizzleService.db
        .select(selectFields)
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
    const selectFields = ListingSelectBuilder.getSelectFields();

    const [listing] = await this.drizzleService.db
      .select(selectFields)
      .from(listings)
      .leftJoin(cities, eq(listings.cityId, cities.id))
      .leftJoin(areas, eq(listings.areaId, areas.id))
      .where(eq(listings.id, id))
      .limit(1);

    return listing || null;
  }
}
