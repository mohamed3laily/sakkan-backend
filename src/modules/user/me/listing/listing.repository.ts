import { Injectable } from '@nestjs/common';
import { DrizzleService } from 'src/modules/db/drizzle.service';
import { listings } from 'src/modules/db/schemas/listing/listing';
import { ListingFiltersDto } from './dto/listing-filters.dto';
import { ListingSortDto } from './dto/listing-sort.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { buildListingOrderBy, buildListingWhere } from './builders/listing-query.builder';
import { ListingSelectBuilder } from './builders/listing-select.builder';
import { cities } from 'src/modules/db/schemas/cities/cities';
import { users } from 'src/modules/db/schemas/user/user';
import { propertyType } from 'src/modules/db/schemas/listing/property-type';
import { eq, count, and } from 'drizzle-orm';
import { attachments } from 'src/modules/db/schemas/attachments/attachments';

@Injectable()
export class ListingRepository {
  constructor(private drizzleService: DrizzleService) {}

  async findAll(
    filters: ListingFiltersDto,
    sort: ListingSortDto,
    pagination: PaginationDto,
    userId: number,
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
        .leftJoin(
          attachments,
          and(eq(attachments.attachableId, listings.id), eq(attachments.attachableType, 'LISTING')),
        )
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

  async findById(id: number, userId: number) {
    const selectFields = ListingSelectBuilder.getSelectFields(userId);

    const [listing] = await this.drizzleService.db
      .select(selectFields)
      .from(listings)
      .leftJoin(cities, eq(listings.cityId, cities.id))
      .leftJoin(propertyType, eq(listings.propertyTypeId, propertyType.id))
      .leftJoin(users, eq(listings.userId, users.id))
      .leftJoin(
        attachments,
        and(eq(attachments.attachableId, listings.id), eq(attachments.attachableType, 'LISTING')),
      )
      .where(and(eq(listings.id, id), eq(listings.userId, userId)))
      .limit(1);

    return listing || null;
  }

  async deleteById(id: number, userId: number): Promise<boolean> {
    const result = await this.drizzleService.db
      .delete(listings)
      .where(and(eq(listings.id, id), eq(listings.userId, userId)))
      .returning({ id: listings.id });

    return result.length > 0;
  }
}
