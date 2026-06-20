import { Injectable } from '@nestjs/common';
import { and, asc, count, eq, ilike, inArray, or, sql } from 'drizzle-orm';

import { DrizzleService } from 'src/modules/db/drizzle.service';
import { attachments } from 'src/modules/db/schemas/schema-index';
import { areas } from 'src/modules/db/schemas/cities/areas';
import { cities } from 'src/modules/db/schemas/cities/cities';
import { developersProjects } from 'src/modules/db/schemas/real-state-developers/developers-projects';
import { realEstateDevelopers } from 'src/modules/db/schemas/real-state-developers/real-estate-developers';
import { listings } from 'src/modules/db/schemas/listing/listing';
import { ProjectQueryDto } from './dto/project-query.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

const PROJECT_COLUMNS = {
  id: developersProjects.id,
  developerId: developersProjects.developerId,
  nameEn: developersProjects.nameEn,
  nameAr: developersProjects.nameAr,
  descriptionEn: developersProjects.descriptionEn,
  descriptionAr: developersProjects.descriptionAr,
  addressEn: developersProjects.addressEn,
  addressAr: developersProjects.addressAr,
  latitude: developersProjects.latitude,
  longitude: developersProjects.longitude,
  priceStartingFrom: developersProjects.priceStartingFrom,
  commissionPercentage: developersProjects.commissionPercentage,
  phone: developersProjects.phone,
  whatsappPhone: developersProjects.whatsappPhone,
  createdAt: developersProjects.createdAt,
  updatedAt: developersProjects.updatedAt,
  developer: {
    id: realEstateDevelopers.id,
    nameEn: realEstateDevelopers.nameEn,
    nameAr: realEstateDevelopers.nameAr,
    logo: realEstateDevelopers.logo,
  },
  city: {
    id: cities.id,
    nameEn: cities.nameEn,
    nameAr: cities.nameAr,
  },
  area: {
    id: areas.id,
    nameEn: areas.nameEn,
    nameAr: areas.nameAr,
  },
  attachments: sql<{ id: number; url: string; fileType: string; mimeType: string }[]>`
    COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'id', ${attachments.id},
            'url', ${attachments.url},
            'fileType', ${attachments.fileType},
            'mimeType', ${attachments.mimeType}
          )
        )
        FROM ${attachments}
        WHERE ${attachments.attachableId} = ${developersProjects.id}
          AND ${attachments.attachableType} = 'DEVELOPER_PROJECT'
      ),
      '[]'
    )
  `.as('attachments'),
} as const;

@Injectable()
export class ProjectsRepo {
  constructor(private readonly drizzle: DrizzleService) {}

  async findAll(query: ProjectQueryDto) {
    const { page = 1, limit = 10, developerId, cityId, search } = query;
    const offset = (page - 1) * limit;

    const conditions = [
      developerId ? eq(developersProjects.developerId, developerId) : undefined,
      cityId ? eq(developersProjects.cityId, cityId) : undefined,
      search
        ? or(
            ilike(developersProjects.nameEn, `%${search}%`),
            ilike(developersProjects.nameAr, `%${search}%`),
          )
        : undefined,
    ].filter(Boolean) as ReturnType<typeof eq>[];

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, [{ total }]] = await Promise.all([
      this.drizzle.db
        .select(PROJECT_COLUMNS)
        .from(developersProjects)
        .leftJoin(cities, eq(developersProjects.cityId, cities.id))
        .leftJoin(areas, eq(developersProjects.areaId, areas.id))
        .innerJoin(realEstateDevelopers, eq(developersProjects.developerId, realEstateDevelopers.id))
        .where(whereClause)
        .orderBy(asc(developersProjects.createdAt))
        .limit(limit)
        .offset(offset),

      this.drizzle.db
        .select({ total: count() })
        .from(developersProjects)
        .where(whereClause),
    ]);

    return { data, total: Number(total) };
  }

  async findById(id: number) {
    const [row] = await this.drizzle.db
      .select(PROJECT_COLUMNS)
      .from(developersProjects)
      .leftJoin(cities, eq(developersProjects.cityId, cities.id))
      .leftJoin(areas, eq(developersProjects.areaId, areas.id))
      .innerJoin(realEstateDevelopers, eq(developersProjects.developerId, realEstateDevelopers.id))
      .where(eq(developersProjects.id, id))
      .limit(1);

    return row ?? null;
  }

  async create(dto: CreateProjectDto) {
    const { developerId, cityId, areaId, ...rest } = dto;
    const [row] = await this.drizzle.db
      .insert(developersProjects)
      .values({ developerId, cityId, areaId: areaId ?? null, ...rest })
      .returning({ id: developersProjects.id });

    return row!;
  }

  async update(id: number, dto: UpdateProjectDto) {
    const { removeAttachmentIds: _, ...fields } = dto;
    const [row] = await this.drizzle.db
      .update(developersProjects)
      .set(fields)
      .where(eq(developersProjects.id, id))
      .returning({ id: developersProjects.id });

    return row ?? null;
  }

  async delete(id: number) {
    const [row] = await this.drizzle.db
      .delete(developersProjects)
      .where(eq(developersProjects.id, id))
      .returning({ id: developersProjects.id });

    return row ?? null;
  }

  async findDeveloperById(id: number) {
    const [row] = await this.drizzle.db
      .select({ id: realEstateDevelopers.id })
      .from(realEstateDevelopers)
      .where(eq(realEstateDevelopers.id, id))
      .limit(1);
    return row ?? null;
  }

  async findCityById(id: number) {
    const [row] = await this.drizzle.db
      .select({ id: cities.id })
      .from(cities)
      .where(eq(cities.id, id))
      .limit(1);
    return row ?? null;
  }

  async findAreaByCityAndId(cityId: number, areaId: number) {
    const [row] = await this.drizzle.db
      .select({ id: areas.id })
      .from(areas)
      .where(and(eq(areas.id, areaId), eq(areas.cityId, cityId)))
      .limit(1);
    return row ?? null;
  }

  async findProjectAttachments(projectId: number) {
    return this.drizzle.db
      .select({ id: attachments.id, key: attachments.key })
      .from(attachments)
      .where(
        and(
          eq(attachments.attachableType, 'DEVELOPER_PROJECT'),
          eq(attachments.attachableId, projectId),
        ),
      );
  }

  async validateAttachmentIds(projectId: number, ids: number[]) {
    if (ids.length === 0) return true;
    const rows = await this.drizzle.db
      .select({ id: attachments.id })
      .from(attachments)
      .where(
        and(
          eq(attachments.attachableType, 'DEVELOPER_PROJECT'),
          eq(attachments.attachableId, projectId),
          inArray(attachments.id, ids),
        ),
      );
    return rows.length === ids.length;
  }

  async deleteAttachmentsByIds(ids: number[]) {
    if (ids.length === 0) return;
    await this.drizzle.db.delete(attachments).where(inArray(attachments.id, ids));
  }

  async findListingsByProjectId(projectId: number) {
    return this.drizzle.db
      .select({ id: listings.id })
      .from(listings)
      .where(eq(listings.projectId, projectId));
  }

  async findListingAttachmentKeys(listingIds: number[]) {
    if (listingIds.length === 0) return [];
    return this.drizzle.db
      .select({ id: attachments.id, key: attachments.key })
      .from(attachments)
      .where(
        and(
          eq(attachments.attachableType, 'LISTING'),
          inArray(attachments.attachableId, listingIds),
        ),
      );
  }

  async deleteListingsByIds(ids: number[]) {
    if (ids.length === 0) return;
    await this.drizzle.db.delete(listings).where(inArray(listings.id, ids));
  }
}
