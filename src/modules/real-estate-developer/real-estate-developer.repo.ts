import { Injectable } from '@nestjs/common';
import { and, asc, count, eq, inArray, isNotNull, sql, type SQL } from 'drizzle-orm';

import { DrizzleService } from '../db/drizzle.service';
import { areas } from '../db/schemas/cities/areas';
import { cities } from '../db/schemas/cities/cities';
import { listings } from '../db/schemas/listing/listing';
import { attachments, favorites } from '../db/schemas/schema-index';
import { developersProjects } from '../db/schemas/real-state-developers/developers-projects';
import { realEstateDevelopers } from '../db/schemas/real-state-developers/real-estate-developers';
import { PaginationDto } from 'src/common/dto/pagination.dto';

import type { DeveloperProjectsQueryDto } from './dto/developer-projects-query.dto';

const projectSelectFieldsBase = {
  id: developersProjects.id,
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

function getProjectSelectFields(userId?: number) {
  return {
    ...projectSelectFieldsBase,
    isFavorited: userId
      ? sql<boolean>`EXISTS (
          SELECT 1 FROM ${favorites}
          WHERE ${favorites.userId} = ${userId}
            AND ${favorites.favoritableType} = 'DEVELOPER_PROJECT'
            AND ${favorites.favoritableId} = ${developersProjects.id}
        )`.as('isFavorited')
      : sql<boolean>`false`.as('isFavorited'),
  };
}

@Injectable()
export class RealEstateDeveloperRepository {
  constructor(private readonly drizzleService: DrizzleService) {}

  async findAllDevelopers(pagination: PaginationDto) {
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;

    const [data, [{ total }]] = await Promise.all([
      this.drizzleService.db
        .select({
          id: realEstateDevelopers.id,
          nameEn: realEstateDevelopers.nameEn,
          nameAr: realEstateDevelopers.nameAr,
          logo: realEstateDevelopers.logo,
        })
        .from(realEstateDevelopers)
        .orderBy(asc(realEstateDevelopers.createdAt))
        .limit(limit)
        .offset(offset),

      this.drizzleService.db.select({ total: count() }).from(realEstateDevelopers),
    ]);

    return {
      data,
      total: Number(total),
    };
  }

  async findAllProjects(query: DeveloperProjectsQueryDto, userId?: number) {
    const { page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;
    const whereClause = this.buildProjectsWhereClause(query);

    const listBase = this.drizzleService.db
      .select(getProjectSelectFields(userId))
      .from(developersProjects)
      .leftJoin(cities, eq(developersProjects.cityId, cities.id))
      .leftJoin(areas, eq(developersProjects.areaId, areas.id))
      .innerJoin(realEstateDevelopers, eq(developersProjects.developerId, realEstateDevelopers.id))
      .$dynamic();

    const listQuery = whereClause !== undefined ? listBase.where(whereClause) : listBase;

    const countBase = this.drizzleService.db
      .select({ total: count() })
      .from(developersProjects)
      .$dynamic();

    const countQuery = whereClause !== undefined ? countBase.where(whereClause) : countBase;

    const [data, [{ total }]] = await Promise.all([
      listQuery.orderBy(asc(developersProjects.createdAt)).limit(limit).offset(offset),
      countQuery,
    ]);

    return {
      data,
      total: Number(total),
    };
  }

  async findProjectById(id: number, userId?: number) {
    const [row] = await this.drizzleService.db
      .select(getProjectSelectFields(userId))
      .from(developersProjects)
      .leftJoin(cities, eq(developersProjects.cityId, cities.id))
      .leftJoin(areas, eq(developersProjects.areaId, areas.id))
      .innerJoin(realEstateDevelopers, eq(developersProjects.developerId, realEstateDevelopers.id))
      .where(eq(developersProjects.id, id))
      .limit(1);

    return row ?? null;
  }

  private buildProjectsWhereClause(query: DeveloperProjectsQueryDto): SQL | undefined {
    const db = this.drizzleService.db;
    const conditions: SQL[] = [];

    if (query.developerId !== undefined) {
      conditions.push(eq(developersProjects.developerId, query.developerId));
    }
    if (query.cityId !== undefined) {
      conditions.push(eq(developersProjects.cityId, query.cityId));
    }
    if (query.areaId !== undefined) {
      conditions.push(eq(developersProjects.areaId, query.areaId));
    }
    if (query.propertyTypeId !== undefined) {
      conditions.push(
        inArray(
          developersProjects.id,
          db
            .select({ id: listings.projectId })
            .from(listings)
            .where(
              and(isNotNull(listings.projectId), eq(listings.propertyTypeId, query.propertyTypeId)),
            ),
        ),
      );
    }

    return conditions.length ? and(...conditions) : undefined;
  }
}
