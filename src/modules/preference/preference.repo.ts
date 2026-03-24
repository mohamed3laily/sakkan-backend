import { Injectable } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { DrizzleService } from '../db/drizzle.service';
import { preferences } from '../db/schemas/preferences/preferences';
import { PreferableType } from '../db/schemas/preferences/enums';
import { areas, cities, propertyType } from '../db/schemas/schema-index';

@Injectable()
export class PreferenceRepo {
  constructor(private readonly drizzle: DrizzleService) {}

  async findExistingBatch(userId: number, preferableType: PreferableType, preferableIds: number[]) {
    return this.drizzle.db
      .select()
      .from(preferences)
      .where(
        and(
          eq(preferences.userId, userId),
          eq(preferences.preferableType, preferableType),
          inArray(preferences.preferableId, preferableIds),
        ),
      );
  }

  async deleteBatch(ids: number[]) {
    await this.drizzle.db.delete(preferences).where(inArray(preferences.id, ids));
  }

  async createBatch(userId: number, preferableType: PreferableType, preferableIds: number[]) {
    await this.drizzle.db.insert(preferences).values(
      preferableIds.map((preferableId) => ({
        userId,
        preferableType,
        preferableId,
      })),
    );
  }

  async findUserPreferences(userId: number) {
    const rows = await this.drizzle.db
      .select({
        type: preferences.preferableType,
        areaId: areas.id,
        areaNameAr: areas.nameAr,
        areaNameEn: areas.nameEn,
        cityId: cities.id,
        cityNameAr: cities.nameAr,
        cityNameEn: cities.nameEn,
        ptId: propertyType.id,
        ptNameAr: propertyType.nameAr,
        ptNameEn: propertyType.nameEn,
        ptParent: propertyType.parent,
      })
      .from(preferences)
      .leftJoin(
        areas,
        and(eq(areas.id, preferences.preferableId), eq(preferences.preferableType, 'AREA')),
      )
      .leftJoin(cities, eq(cities.id, areas.cityId))
      .leftJoin(
        propertyType,
        and(
          eq(propertyType.id, preferences.preferableId),
          eq(preferences.preferableType, 'PROPERTY_TYPE'),
        ),
      )
      .where(eq(preferences.userId, userId));

    const cityMap = new Map<number, { city: object; areas: object[] }>();
    const propertyTypes: object[] = [];

    for (const row of rows) {
      if (row.type === 'AREA' && row.areaId && row.cityId) {
        if (!cityMap.has(row.cityId)) {
          cityMap.set(row.cityId, {
            city: { id: row.cityId, nameAr: row.cityNameAr, nameEn: row.cityNameEn },
            areas: [],
          });
        }
        cityMap
          .get(row.cityId)!
          .areas.push({ id: row.areaId, nameAr: row.areaNameAr, nameEn: row.areaNameEn });
      } else if (row.type === 'PROPERTY_TYPE' && row.ptId) {
        propertyTypes.push({
          id: row.ptId,
          nameAr: row.ptNameAr,
          nameEn: row.ptNameEn,
          parent: row.ptParent,
        });
      }
    }

    return { areas: Array.from(cityMap.values()), propertyTypes };
  }
}
