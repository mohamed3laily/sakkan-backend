import { Injectable } from '@nestjs/common';
import { and, eq, ilike, or } from 'drizzle-orm';
import { cities } from '../db/schemas/cities/cities';
import { areas } from '../db/schemas/cities/areas';
import { DrizzleService } from '../db/drizzle.service';

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
      })
      .from(cities)
      .where(conditions);
  }

  async findCityAreas(cityId: number, name?: string) {
    const cityCondition = eq(areas.cityId, cityId);

    const filterCondition = name
      ? and(
          cityCondition,
          or(
            ilike(areas.nameEn, `%${name}%`),
            ilike(areas.nameAr, `%${name}%`),
          ),
        )
      : cityCondition;

    return this.drizzleService.db
      .select({
        id: areas.id,
        nameEn: areas.nameEn,
        nameAr: areas.nameAr,
      })
      .from(areas)
      .where(filterCondition);
  }
}
