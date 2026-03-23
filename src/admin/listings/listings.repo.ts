import { Injectable } from '@nestjs/common';
import { DrizzleService } from 'src/modules/db/drizzle.service';
import { listings } from 'src/modules/db/schemas/listing/listing';
import {
  buildListingWhere,
  buildListingOrderBy,
} from 'src/modules/listing/builders/listing-query.builder';
import { cities } from 'src/modules/db/schemas/cities/cities';
import { propertyType } from 'src/modules/db/schemas/listing/property-type';
import { users } from 'src/modules/db/schemas/schema-index';
import { eq, count, sql } from 'drizzle-orm';
import { ListingSelectBuilder } from './builders/listing-select.builder';
import { ListingFiltersDto } from './dto/listing-filters.dto';
import { ListingSortDto } from './dto/listing-sort.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class ListingsRepo {
  constructor(private readonly drizzleService: DrizzleService) {}

  async findAll(filters: ListingFiltersDto, sort: ListingSortDto, pagination: PaginationDto) {
    const whereClause = buildListingWhere(filters);
    const orderByClause = buildListingOrderBy(sort);
    const selectFields = ListingSelectBuilder.getSelectFields();

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
  async findById(id: number) {
    const selectFields = ListingSelectBuilder.getSelectFields();
    const [listing] = await this.drizzleService.db
      .select(selectFields)
      .from(listings)
      .where(eq(listings.id, id))
      .limit(1);
    return listing || null;
  }

  async delete(id: number) {
    await this.drizzleService.db.delete(listings).where(eq(listings.id, id));
  }

  async updateStatus(id: number, status: 'PUBLISHED' | 'UNLISTED' | 'PENDING') {
    const [updated] = await this.drizzleService.db
      .update(listings)
      .set({ status })
      .where(eq(listings.id, id))
      .returning({ id: listings.id, status: listings.status });

    return updated ?? null;
  }
}
