import { Injectable, BadRequestException } from '@nestjs/common';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import { MultiPolygon, Polygon } from 'geojson';
import { eq } from 'drizzle-orm';

import { DrizzleService } from '../db/drizzle.service';
import { areas } from '../db/schemas/schema-index';
import { CreateListingDto } from './dto/create-listing.dto';

@Injectable()
export class GeoValidationService {
  constructor(private readonly drizzle: DrizzleService) {}

  async validateListingLocation(dto: CreateListingDto): Promise<void> {
    const { latitude, longitude, areaIds } = dto;

    if (latitude == null || longitude == null) return;
    if (!areaIds?.length) return;

    const areaId = areaIds[0];

    const [area] = await this.drizzle.db
      .select({ geometry: areas.geometry })
      .from(areas)
      .where(eq(areas.id, areaId))
      .limit(1);

    if (!area?.geometry) return;

    const inside = booleanPointInPolygon(
      point([longitude, latitude]),
      area.geometry as Polygon | MultiPolygon,
    );

    if (!inside) {
      throw new BadRequestException('LOCATION_VALIDATION_FAILED');
    }
  }
}
