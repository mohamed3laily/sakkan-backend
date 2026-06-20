import { Injectable } from '@nestjs/common';
import { and, asc, count, eq, ilike, inArray, or } from 'drizzle-orm';

import { DrizzleService } from 'src/modules/db/drizzle.service';
import { attachments } from 'src/modules/db/schemas/schema-index';
import { developersProjects } from 'src/modules/db/schemas/real-state-developers/developers-projects';
import { realEstateDevelopers } from 'src/modules/db/schemas/real-state-developers/real-estate-developers';
import { listings } from 'src/modules/db/schemas/listing/listing';
import { DeveloperQueryDto } from './dto/developer-query.dto';
import { CreateDeveloperDto } from './dto/create-developer.dto';
import { UpdateDeveloperDto } from './dto/update-developer.dto';

const DEVELOPER_COLUMNS = {
  id: realEstateDevelopers.id,
  nameEn: realEstateDevelopers.nameEn,
  nameAr: realEstateDevelopers.nameAr,
  logo: realEstateDevelopers.logo,
  createdAt: realEstateDevelopers.createdAt,
  updatedAt: realEstateDevelopers.updatedAt,
} as const;

@Injectable()
export class DevelopersRepo {
  constructor(private readonly drizzle: DrizzleService) {}

  async findAll(query: DeveloperQueryDto) {
    const { page = 1, limit = 10, search } = query;
    const offset = (page - 1) * limit;
    const whereClause = search
      ? or(
          ilike(realEstateDevelopers.nameEn, `%${search}%`),
          ilike(realEstateDevelopers.nameAr, `%${search}%`),
        )
      : undefined;

    const [data, [{ total }]] = await Promise.all([
      this.drizzle.db
        .select(DEVELOPER_COLUMNS)
        .from(realEstateDevelopers)
        .where(whereClause)
        .orderBy(asc(realEstateDevelopers.createdAt))
        .limit(limit)
        .offset(offset),

      this.drizzle.db
        .select({ total: count() })
        .from(realEstateDevelopers)
        .where(whereClause),
    ]);

    return { data, total: Number(total) };
  }

  async findById(id: number) {
    const [row] = await this.drizzle.db
      .select(DEVELOPER_COLUMNS)
      .from(realEstateDevelopers)
      .where(eq(realEstateDevelopers.id, id))
      .limit(1);

    return row ?? null;
  }

  async create(dto: CreateDeveloperDto, logoUrl: string) {
    const [row] = await this.drizzle.db
      .insert(realEstateDevelopers)
      .values({ ...dto, logo: logoUrl })
      .returning(DEVELOPER_COLUMNS);

    return row!;
  }

  async update(id: number, dto: UpdateDeveloperDto, logoUrl?: string) {
    const updateValues: Partial<typeof realEstateDevelopers.$inferInsert> = { ...dto };
    if (logoUrl !== undefined) {
      updateValues.logo = logoUrl;
    }

    const [row] = await this.drizzle.db
      .update(realEstateDevelopers)
      .set(updateValues)
      .where(eq(realEstateDevelopers.id, id))
      .returning(DEVELOPER_COLUMNS);

    return row ?? null;
  }

  async delete(id: number) {
    const [row] = await this.drizzle.db
      .delete(realEstateDevelopers)
      .where(eq(realEstateDevelopers.id, id))
      .returning({ id: realEstateDevelopers.id });

    return row ?? null;
  }

  /** Returns all projects under a developer with their DEVELOPER_PROJECT attachment keys. */
  async findProjectsWithAttachments(developerId: number) {
    const projects = await this.drizzle.db
      .select({ id: developersProjects.id })
      .from(developersProjects)
      .where(eq(developersProjects.developerId, developerId));

    if (projects.length === 0) return [];

    const projectIds = projects.map((p) => p.id);

    const projectAttachments = await this.drizzle.db
      .select({ id: attachments.id, key: attachments.key })
      .from(attachments)
      .where(
        and(
          eq(attachments.attachableType, 'DEVELOPER_PROJECT'),
          inArray(attachments.attachableId, projectIds),
        ),
      );

    return projects.map((p) => ({
      id: p.id,
      attachments: projectAttachments.filter(() => true),
    }));
  }

  /** Returns listing IDs and their attachment keys for listings linked to the given project IDs. */
  async findListingsByProjectIds(projectIds: number[]) {
    if (projectIds.length === 0) return [];

    return this.drizzle.db
      .select({ id: listings.id })
      .from(listings)
      .where(inArray(listings.projectId, projectIds));
  }

  /** Returns DEVELOPER_PROJECT attachment keys for given project IDs. */
  async findProjectAttachmentKeys(projectIds: number[]) {
    if (projectIds.length === 0) return [];

    return this.drizzle.db
      .select({ id: attachments.id, key: attachments.key })
      .from(attachments)
      .where(
        and(
          eq(attachments.attachableType, 'DEVELOPER_PROJECT'),
          inArray(attachments.attachableId, projectIds),
        ),
      );
  }

  /** Returns LISTING attachment keys for given listing IDs. */
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

  async deleteAttachmentsByIds(ids: number[]) {
    if (ids.length === 0) return;
    await this.drizzle.db.delete(attachments).where(inArray(attachments.id, ids));
  }

  async deleteListingsByIds(ids: number[]) {
    if (ids.length === 0) return;
    await this.drizzle.db.delete(listings).where(inArray(listings.id, ids));
  }

  async deleteProjectsByIds(ids: number[]) {
    if (ids.length === 0) return;
    await this.drizzle.db
      .delete(developersProjects)
      .where(inArray(developersProjects.id, ids));
  }
}
