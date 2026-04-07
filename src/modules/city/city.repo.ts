import { Injectable } from '@nestjs/common';
import { and, eq, ilike, or } from 'drizzle-orm';
import { cities } from '../db/schemas/cities/cities';
import { areas } from '../db/schemas/cities/areas';
import { DrizzleService } from '../db/drizzle.service';
import { geometry } from 'drizzle-orm/pg-core';

@Injectable()
export class CityRepository {
  constructor(private readonly drizzleService: DrizzleService) {}

  async findAllCities(name?: string) {
    const conditions = name
      ? or(ilike(cities.nameEn, `%${name}%`), ilike(cities.nameAr, `%${name}%`))
      : undefined;

    return this.drizzleService.db
      .select({
        id: cities.id,
        nameEn: cities.nameEn,
        nameAr: cities.nameAr,
        listingCount: cities.listingCount,
        latitude: cities.latitude,
        longitude: cities.longitude,
      })
      .from(cities)
      .orderBy(cities.id)
      .where(conditions);
  }

  async findCityAreas(cityId: number, name?: string) {
    const cityCondition = eq(areas.cityId, cityId);

    const filterCondition = name
      ? and(cityCondition, or(ilike(areas.nameEn, `%${name}%`), ilike(areas.nameAr, `%${name}%`)))
      : cityCondition;

    return this.drizzleService.db
      .select({
        id: areas.id,
        nameEn: areas.nameEn,
        nameAr: areas.nameAr,
        latitude: areas.latitude,
        longitude: areas.longitude,
        geometry: areas.geometry,
      })
      .from(areas)
      .where(filterCondition);
  }
}
