import { Injectable, BadRequestException, OnApplicationBootstrap } from '@nestjs/common';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import { Feature, Polygon, MultiPolygon } from 'geojson';
import { readFileSync } from 'fs';
import { join } from 'path';
import { DrizzleService } from '../db/drizzle.service';
import { areas } from '../db/schemas/schema-index';
import { CreateListingDto } from './dto/create-listing.dto';

const geojson = JSON.parse(
  readFileSync(join(process.cwd(), 'src/modules/city/data/egypt-geo.json'), 'utf-8'),
);

type GeoFeature = Feature<Polygon | MultiPolygon>;

@Injectable()
export class GeoValidationService implements OnApplicationBootstrap {
  private featureByAreaId = new Map<number, GeoFeature>();

  constructor(private readonly drizzle: DrizzleService) {}

  async onApplicationBootstrap() {
    const featureByAreaName = new Map<string, GeoFeature>();
    for (const feature of geojson.features as GeoFeature[]) {
      const { area_en } = feature.properties ?? {};
      if (area_en) featureByAreaName.set(area_en, feature);
    }

    const allAreas = await this.drizzle.db
      .select({ id: areas.id, nameEn: areas.nameEn })
      .from(areas);

    for (const area of allAreas) {
      const feature = featureByAreaName.get(area.nameEn);
      if (feature) this.featureByAreaId.set(area.id, feature);
    }
  }

  async validateListingLocation(dto: CreateListingDto): Promise<void> {
    const { latitude, longitude, areaIds } = dto;

    if (latitude == null || longitude == null) return;
    if (!areaIds?.length) return;

    const areaId = areaIds[0];

    const feature = this.featureByAreaId.get(areaId);
    if (!feature) return;

    const inside = booleanPointInPolygon(point([longitude, latitude]), feature);

    if (!inside) {
      throw new BadRequestException('LOCATION_VALIDATION_FAILED');
    }
  }
}
