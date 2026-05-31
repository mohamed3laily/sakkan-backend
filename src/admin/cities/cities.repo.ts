import { Injectable } from '@nestjs/common';
import { and, count, eq, ilike, or, sql } from 'drizzle-orm';

import { DrizzleService } from 'src/modules/db/drizzle.service';
import { areas, cities, listings } from 'src/modules/db/schemas/schema-index';
import { AdminCityQueryDto } from './dto/city-query.dto';
import { CreateAreaDto } from './dto/create-area.dto';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateAreaDto } from './dto/update-area.dto';
import { UpdateCityDto } from './dto/update-city.dto';

const CITY_COLUMNS = {
  id: cities.id,
  nameEn: cities.nameEn,
  nameAr: cities.nameAr,
  listingCount: cities.listingCount,
  areasCount: cities.areasCount,
  latitude: cities.latitude,
  longitude: cities.longitude,
  createdAt: cities.createdAt,
  updatedAt: cities.updatedAt,
} as const;

const AREA_COLUMNS = {
  id: areas.id,
  cityId: areas.cityId,
  nameEn: areas.nameEn,
  nameAr: areas.nameAr,
  latitude: areas.latitude,
  longitude: areas.longitude,
  geometry: areas.geometry,
  createdAt: areas.createdAt,
  updatedAt: areas.updatedAt,
} as const;

@Injectable()
export class CitiesRepo {
  constructor(private readonly drizzleService: DrizzleService) {}

  async findAll(query: AdminCityQueryDto) {
    const { page = 1, limit = 10, search } = query;
    const offset = (page - 1) * limit;
    const whereClause = search
      ? or(ilike(cities.nameEn, `%${search}%`), ilike(cities.nameAr, `%${search}%`))
      : undefined;

    const [data, [{ total }]] = await Promise.all([
      this.drizzleService.db
        .select(CITY_COLUMNS)
        .from(cities)
        .where(whereClause)
        .orderBy(cities.id)
        .limit(limit)
        .offset(offset),
      this.drizzleService.db.select({ total: count() }).from(cities).where(whereClause),
    ]);

    return { data, total: Number(total) };
  }

  async findById(id: number) {
    const [city] = await this.drizzleService.db
      .select(CITY_COLUMNS)
      .from(cities)
      .where(eq(cities.id, id))
      .limit(1);

    return city ?? null;
  }

  async findAreasByCityId(cityId: number) {
    return this.drizzleService.db
      .select(AREA_COLUMNS)
      .from(areas)
      .where(eq(areas.cityId, cityId))
      .orderBy(areas.id);
  }

  async findAreaById(cityId: number, areaId: number) {
    const [area] = await this.drizzleService.db
      .select(AREA_COLUMNS)
      .from(areas)
      .where(and(eq(areas.id, areaId), eq(areas.cityId, cityId)))
      .limit(1);

    return area ?? null;
  }

  async findByNameEn(nameEn: string, excludeId?: number) {
    const conditions = excludeId
      ? and(eq(cities.nameEn, nameEn), sql`${cities.id} != ${excludeId}`)
      : eq(cities.nameEn, nameEn);

    const [row] = await this.drizzleService.db
      .select({ id: cities.id })
      .from(cities)
      .where(conditions)
      .limit(1);

    return row ?? null;
  }

  async create(dto: CreateCityDto) {
    const [created] = await this.drizzleService.db
      .insert(cities)
      .values({
        nameEn: dto.nameEn,
        nameAr: dto.nameAr,
        latitude: dto.latitude ?? null,
        longitude: dto.longitude ?? null,
      })
      .returning(CITY_COLUMNS);

    return created;
  }

  async update(id: number, dto: UpdateCityDto) {
    const [updated] = await this.drizzleService.db
      .update(cities)
      .set(dto)
      .where(eq(cities.id, id))
      .returning(CITY_COLUMNS);

    return updated ?? null;
  }

  async delete(id: number) {
    const [deleted] = await this.drizzleService.db
      .delete(cities)
      .where(eq(cities.id, id))
      .returning({ id: cities.id });

    return deleted ?? null;
  }

  async countListingsByCityId(cityId: number) {
    const [{ total }] = await this.drizzleService.db
      .select({ total: count() })
      .from(listings)
      .where(eq(listings.cityId, cityId));

    return Number(total);
  }

  async createArea(cityId: number, dto: CreateAreaDto) {
    const [created] = await this.drizzleService.db
      .insert(areas)
      .values({
        cityId,
        nameEn: dto.nameEn,
        nameAr: dto.nameAr,
        latitude: dto.latitude ?? null,
        longitude: dto.longitude ?? null,
        geometry: dto.geometry ?? null,
      })
      .returning(AREA_COLUMNS);

    await this.syncAreasCount(cityId);
    return created;
  }

  async updateArea(cityId: number, areaId: number, dto: UpdateAreaDto) {
    const [updated] = await this.drizzleService.db
      .update(areas)
      .set(dto)
      .where(and(eq(areas.id, areaId), eq(areas.cityId, cityId)))
      .returning(AREA_COLUMNS);

    return updated ?? null;
  }

  async deleteArea(cityId: number, areaId: number) {
    const [deleted] = await this.drizzleService.db
      .delete(areas)
      .where(and(eq(areas.id, areaId), eq(areas.cityId, cityId)))
      .returning({ id: areas.id });

    if (deleted) {
      await this.syncAreasCount(cityId);
    }

    return deleted ?? null;
  }

  async countListingsUsingArea(areaId: number) {
    const [{ total }] = await this.drizzleService.db
      .select({ total: count() })
      .from(listings)
      .where(sql`${areaId} = ANY(${listings.areaIds})`);

    return Number(total);
  }

  private async syncAreasCount(cityId: number) {
    await this.drizzleService.db
      .update(cities)
      .set({
        areasCount: sql`(SELECT COUNT(*)::integer FROM ${areas} WHERE ${areas.cityId} = ${cityId})`,
      })
      .where(eq(cities.id, cityId));
  }
}
