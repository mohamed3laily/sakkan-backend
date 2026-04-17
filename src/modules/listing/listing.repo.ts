import { propertyType } from '../db/schemas/listing/property-type';
import { Injectable } from '@nestjs/common';
import { CreateListingDto } from './dto/create-listing.dto';
import { DrizzleService } from '../db/drizzle.service';
import { listings } from '../db/schemas/listing/listing';
import { cities } from '../db/schemas/cities/cities';
import { and, count, eq } from 'drizzle-orm';
import { ListingFiltersDto } from './dto/listing-filters.dto';
import { ListingSortDto } from './dto/listing-sort.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { buildListingOrderBy, buildListingWhere } from './builders/listing-query.builder';
import { ListingSelectBuilder } from './builders/listing-select.builder';
import { attachments, users } from '../db/schemas/schema-index';

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
        propertyTypeId: dto.propertyTypeId,
        cityId: dto.cityId,
        areaIds: dto.areaIds ?? [],
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
        agentId: dto.agentId,
      })
      .returning();

    return listing;
  }

  async findAll(
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

  async publishAsSerious(
    listingId: number,
    ownerUserId: number,
    monetizationPaymentId: number | null,
    quotaSource: 'subscription' | 'credits',
  ) {
    const [row] = await this.drizzleService.db
      .update(listings)
      .set({
        listingTier: 'serious',
        isSerious: true,
        status: 'PUBLISHED',
        monetizationPaymentId,
        quotaSource,
      })
      .where(and(eq(listings.id, listingId), eq(listings.userId, ownerUserId)))
      .returning({ id: listings.id });

    return row ?? null;
  }

  async publishAsFeatured(
    listingId: number,
    ownerUserId: number,
    monetizationPaymentId: number | null,
    quotaSource: 'subscription' | 'credits',
  ) {
    const featuredExpiresAt = new Date();
    featuredExpiresAt.setUTCDate(featuredExpiresAt.getUTCDate() + 30);

    const [row] = await this.drizzleService.db
      .update(listings)
      .set({
        listingTier: 'featured',
        isFeaturedAd: true,
        featuredExpiresAt: featuredExpiresAt.toISOString(),
        status: 'PUBLISHED',
        monetizationPaymentId,
        quotaSource,
      })
      .where(and(eq(listings.id, listingId), eq(listings.userId, ownerUserId)))
      .returning({ id: listings.id });

    return row ?? null;
  }

  async publishAsSeriousByPayment(listingId: number, monetizationPaymentId: number) {
    const [row] = await this.drizzleService.db
      .update(listings)
      .set({
        listingTier: 'serious',
        isSerious: true,
        status: 'PUBLISHED',
        monetizationPaymentId,
        quotaSource: 'credits',
      })
      .where(eq(listings.id, listingId))
      .returning({ id: listings.id });

    return row ?? null;
  }

  async publishAsFeaturedByPayment(listingId: number, monetizationPaymentId: number) {
    const featuredExpiresAt = new Date();
    featuredExpiresAt.setUTCDate(featuredExpiresAt.getUTCDate() + 30);

    const [row] = await this.drizzleService.db
      .update(listings)
      .set({
        listingTier: 'featured',
        isFeaturedAd: true,
        featuredExpiresAt: featuredExpiresAt.toISOString(),
        status: 'PUBLISHED',
        monetizationPaymentId,
        quotaSource: 'credits',
      })
      .where(eq(listings.id, listingId))
      .returning({ id: listings.id });

    return row ?? null;
  }

  async findOwnerId(listingId: number): Promise<number | null> {
    const rows = await this.drizzleService.db
      .select({ userId: listings.userId })
      .from(listings)
      .where(eq(listings.id, listingId))
      .limit(1);
    return rows[0]?.userId ?? null;
  }

  async findById(id: number, userId?: number) {
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
      .where(eq(listings.id, id))
      .limit(1);

    return listing || null;
  }

  async getPropertyTypes(parent?: (typeof propertyType.$inferSelect)['parent']) {
    const db = this.drizzleService.db;

    return db
      .select()
      .from(propertyType)
      .where(parent ? eq(propertyType.parent, parent) : undefined)
      .orderBy(propertyType.parent, propertyType.nameEn);
  }
}
