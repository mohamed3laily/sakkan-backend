import { Injectable } from '@nestjs/common';
import { count, eq, and } from 'drizzle-orm';
import { cities, listings, propertyType, users } from '../db/schemas/schema-index';
import { DrizzleService } from '../db/drizzle.service';
import { ListingFiltersDto } from './dto/listing-filters.dto';
import { ListingSortDto } from './dto/listing-sort.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { buildListingOrderBy, buildListingWhere } from './builders/listing-query.builder';
import { ListingSelectBuilder } from './builders/listing-select.builder';

@Injectable()
export class UserRepo {
  constructor(private drizzleService: DrizzleService) {}

  async getUserById(id: number) {
    return this.drizzleService.db.query.users.findFirst({
      where: eq(users.id, id),
    });
  }

  async findAllListings(
    filters: ListingFiltersDto,
    sort: ListingSortDto,
    pagination: PaginationDto,
    userId?: number,
  ) {
    const whereClause = buildListingWhere(filters, userId);
    const orderByClause = buildListingOrderBy(sort);
    const selectFields = ListingSelectBuilder.getSelectFields(userId);

    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    const [data, [{ total }]] = await Promise.all([
      this.drizzleService.db
        .select(selectFields)
        .from(listings)
        .leftJoin(cities, eq(listings.cityId, cities.id))
        .leftJoin(propertyType, eq(listings.propertyTypeId, propertyType.id))
        .leftJoin(users, eq(listings.userId, users.id))
        .where(whereClause)
        .orderBy(orderByClause)
        .limit(limit)
        .offset(offset),

      this.drizzleService.db.select({ total: count() }).from(listings).where(whereClause),
    ]);

    return {
      data,
      total: Number(total),
    };
  }

  async findListingById(id: number, userId: number) {
    const selectFields = ListingSelectBuilder.getSelectFields(userId);

    const [listing] = await this.drizzleService.db
      .select(selectFields)
      .from(listings)
      .leftJoin(cities, eq(listings.cityId, cities.id))
      .leftJoin(propertyType, eq(listings.propertyTypeId, propertyType.id))
      .leftJoin(users, eq(listings.userId, users.id))
      .where(and(eq(listings.id, id), eq(listings.userId, userId)))
      .limit(1);

    return listing || null;
  }
}
