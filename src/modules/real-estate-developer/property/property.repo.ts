import { Injectable } from '@nestjs/common';
import { and, count, desc, eq } from 'drizzle-orm';

import { DrizzleService } from '../../db/drizzle.service';
import { listings } from '../../db/schemas/listing/listing';
import { propertyType } from '../../db/schemas/listing/property-type';
import {
  areas,
  cities,
  developersProjects,
  realEstateDevelopers,
} from '../../db/schemas/schema-index';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { getProjectPropertySelectFields } from './builders/project-property-select';

@Injectable()
export class PropertyRepository {
  constructor(private readonly drizzleService: DrizzleService) {}

  async findByProjectId(projectId: number, pagination: PaginationDto, userId?: number) {
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;
    const selectFields = getProjectPropertySelectFields(userId);

    const whereClause = and(eq(listings.projectId, projectId), eq(listings.listingType, 'OFFER'));

    const [data, [{ total }]] = await Promise.all([
      this.drizzleService.db
        .select(selectFields)
        .from(listings)
        .leftJoin(propertyType, eq(listings.propertyTypeId, propertyType.id))
        .leftJoin(developersProjects, eq(listings.projectId, developersProjects.id))
        .leftJoin(realEstateDevelopers, eq(developersProjects.developerId, realEstateDevelopers.id))
        .leftJoin(cities, eq(developersProjects.cityId, cities.id))
        .leftJoin(areas, eq(developersProjects.areaId, areas.id))
        .where(whereClause)
        .orderBy(desc(listings.createdAt))
        .limit(limit)
        .offset(offset),

      this.drizzleService.db.select({ total: count() }).from(listings).where(whereClause),
    ]);

    return {
      data,
      total: Number(total),
    };
  }

  async findOneInProject(projectId: number, listingId: number, userId?: number) {
    const selectFields = getProjectPropertySelectFields(userId);

    const [row] = await this.drizzleService.db
      .select(selectFields)
      .from(listings)
      .leftJoin(propertyType, eq(listings.propertyTypeId, propertyType.id))
      .leftJoin(developersProjects, eq(listings.projectId, developersProjects.id))
      .leftJoin(realEstateDevelopers, eq(developersProjects.developerId, realEstateDevelopers.id))
      .leftJoin(cities, eq(developersProjects.cityId, cities.id))
      .leftJoin(areas, eq(developersProjects.areaId, areas.id))
      .where(and(eq(listings.id, listingId), eq(listings.projectId, projectId)))
      .limit(1);

    return row ?? null;
  }
}
