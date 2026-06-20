import { Injectable } from '@nestjs/common';
import { and, desc, count, eq, ilike, inArray, isNotNull, or } from 'drizzle-orm';

import { DrizzleService } from 'src/modules/db/drizzle.service';
import { attachments } from 'src/modules/db/schemas/schema-index';
import { areas } from 'src/modules/db/schemas/cities/areas';
import { cities } from 'src/modules/db/schemas/cities/cities';
import { developersProjects } from 'src/modules/db/schemas/real-state-developers/developers-projects';
import { realEstateDevelopers } from 'src/modules/db/schemas/real-state-developers/real-estate-developers';
import { listings } from 'src/modules/db/schemas/listing/listing';
import { propertyType } from 'src/modules/db/schemas/listing/property-type';
import { developerListingSelectFields } from './builders/developer-listing-select.builder';
import { DeveloperListingQueryDto } from './dto/developer-listing-query.dto';
import { CreateDeveloperListingDto } from './dto/create-developer-listing.dto';
import { UpdateDeveloperListingDto } from './dto/update-developer-listing.dto';

const developerListingBaseWhere = and(
  isNotNull(listings.projectId),
  eq(listings.listingType, 'OFFER'),
);

@Injectable()
export class DeveloperListingsRepo {
  constructor(private readonly drizzle: DrizzleService) {}

  private buildListWhere(query: DeveloperListingQueryDto) {
    const { projectId, developerId, search } = query;

    const conditions = [
      developerListingBaseWhere,
      projectId ? eq(listings.projectId, projectId) : undefined,
      developerId ? eq(developersProjects.developerId, developerId) : undefined,
      search
        ? or(ilike(listings.title, `%${search}%`), ilike(listings.description, `%${search}%`))
        : undefined,
    ].filter(Boolean);

    return conditions.length > 0 ? and(...conditions) : developerListingBaseWhere;
  }

  private listQueryBase() {
    return this.drizzle.db
      .select(developerListingSelectFields)
      .from(listings)
      .leftJoin(propertyType, eq(listings.propertyTypeId, propertyType.id))
      .leftJoin(developersProjects, eq(listings.projectId, developersProjects.id))
      .leftJoin(realEstateDevelopers, eq(developersProjects.developerId, realEstateDevelopers.id))
      .leftJoin(cities, eq(developersProjects.cityId, cities.id))
      .leftJoin(areas, eq(developersProjects.areaId, areas.id))
      .$dynamic();
  }

  async findAll(query: DeveloperListingQueryDto) {
    const { page = 1, limit = 10 } = query;
    const offset = (page - 1) * limit;
    const whereClause = this.buildListWhere(query);

    const listBase = this.listQueryBase();
    const countBase = this.drizzle.db
      .select({ total: count() })
      .from(listings)
      .leftJoin(developersProjects, eq(listings.projectId, developersProjects.id))
      .$dynamic();

    const [data, [{ total }]] = await Promise.all([
      listBase.where(whereClause).orderBy(desc(listings.createdAt)).limit(limit).offset(offset),
      countBase.where(whereClause),
    ]);

    return { data, total: Number(total) };
  }

  async findById(id: number) {
    const whereClause = and(developerListingBaseWhere, eq(listings.id, id));
    const [row] = await this.listQueryBase().where(whereClause).limit(1);
    return row ?? null;
  }

  async findProjectById(projectId: number) {
    const [row] = await this.drizzle.db
      .select({
        id: developersProjects.id,
        cityId: developersProjects.cityId,
        areaId: developersProjects.areaId,
      })
      .from(developersProjects)
      .where(eq(developersProjects.id, projectId))
      .limit(1);

    return row ?? null;
  }

  async findPropertyTypeById(id: number) {
    const [row] = await this.drizzle.db
      .select({ id: propertyType.id })
      .from(propertyType)
      .where(eq(propertyType.id, id))
      .limit(1);

    return row ?? null;
  }

  async create(
    dto: CreateDeveloperListingDto,
    project: { cityId: number; areaId: number | null },
  ) {
    const { projectId, deliveryDate, ...rest } = dto;

    const [row] = await this.drizzle.db
      .insert(listings)
      .values({
        ...rest,
        projectId,
        userId: null,
        dealType: 'BUY',
        listingType: 'OFFER',
        budgetType: 'MARKET',
        cityId: project.cityId,
        areaIds: project.areaId ? [project.areaId] : [],
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
      })
      .returning({ id: listings.id });

    return row!;
  }

  async update(id: number, dto: UpdateDeveloperListingDto, project?: { cityId: number; areaId: number | null }) {
    const { projectId, deliveryDate, ...rest } = dto;
    const updateValues: Partial<typeof listings.$inferInsert> = { ...rest };

    if (projectId !== undefined) {
      updateValues.projectId = projectId;
    }
    if (project) {
      updateValues.cityId = project.cityId;
      updateValues.areaIds = project.areaId ? [project.areaId] : [];
    }
    if (deliveryDate !== undefined) {
      updateValues.deliveryDate = deliveryDate ? new Date(deliveryDate) : null;
    }

    const [row] = await this.drizzle.db
      .update(listings)
      .set(updateValues)
      .where(and(developerListingBaseWhere, eq(listings.id, id)))
      .returning({ id: listings.id });

    return row ?? null;
  }

  async delete(id: number) {
    const [row] = await this.drizzle.db
      .delete(listings)
      .where(and(developerListingBaseWhere, eq(listings.id, id)))
      .returning({ id: listings.id });

    return row ?? null;
  }

  async findListingAttachments(listingId: number) {
    return this.drizzle.db
      .select({ id: attachments.id, key: attachments.key })
      .from(attachments)
      .where(
        and(eq(attachments.attachableType, 'LISTING'), eq(attachments.attachableId, listingId)),
      );
  }

  async deleteAttachmentsByIds(ids: number[]) {
    if (ids.length === 0) return;
    await this.drizzle.db.delete(attachments).where(inArray(attachments.id, ids));
  }
}
