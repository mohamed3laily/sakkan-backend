import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';

import { LogAction } from 'src/common/logging';
import { PaginationService } from 'src/common/services/pagination.service';
import { S3Service } from 'src/modules/storage/s3.service';
import { DevelopersRepo } from './developers.repo';
import { DeveloperQueryDto } from './dto/developer-query.dto';
import { CreateDeveloperDto } from './dto/create-developer.dto';
import { UpdateDeveloperDto } from './dto/update-developer.dto';

@Injectable()
export class DevelopersService {
  private readonly logger = new Logger(DevelopersService.name);

  constructor(
    private readonly repo: DevelopersRepo,
    private readonly paginationService: PaginationService,
    private readonly s3: S3Service,
  ) {}

  async getDevelopers(query: DeveloperQueryDto) {
    const { page = 1, limit = 10 } = query;
    const { data, total } = await this.repo.findAll(query);
    return this.paginationService.createPaginatedResponse(data, total, page, limit);
  }

  async getDeveloperById(id: number) {
    const developer = await this.repo.findById(id);
    if (!developer) {
      throw new NotFoundException('REAL_ESTATE_DEVELOPER_NOT_FOUND');
    }
    return developer;
  }

  async createDeveloper(adminId: number, dto: CreateDeveloperDto, logoFile?: Express.Multer.File) {
    if (!logoFile) {
      throw new BadRequestException('LOGO_REQUIRED');
    }

    const { url: logoUrl } = await this.s3.upload('profile-pictures', logoFile);
    const developer = await this.repo.create(dto, logoUrl);

    this.logger.log(
      { action: LogAction.ADMIN_DEVELOPER_CREATED, adminId, developerId: developer.id },
      'Admin created real estate developer',
    );

    return developer;
  }

  async updateDeveloper(
    adminId: number,
    id: number,
    dto: UpdateDeveloperDto,
    logoFile?: Express.Multer.File,
  ) {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundException('REAL_ESTATE_DEVELOPER_NOT_FOUND');
    }

    let logoUrl: string | undefined;
    if (logoFile) {
      const uploaded = await this.s3.upload('profile-pictures', logoFile);
      logoUrl = uploaded.url;
    }

    const hasFieldUpdates = Object.values(dto).some((value) => value !== undefined);
    let updated = existing;

    if (hasFieldUpdates || logoUrl !== undefined) {
      updated = await this.repo.update(id, dto, logoUrl);
      if (!updated) {
        throw new NotFoundException('REAL_ESTATE_DEVELOPER_NOT_FOUND');
      }
    }

    if (logoFile && existing.logo) {
      await this.s3.delete(existing.logo);
    }

    this.logger.log(
      { action: LogAction.ADMIN_DEVELOPER_UPDATED, adminId, developerId: id },
      'Admin updated real estate developer',
    );

    return updated;
  }

  async deleteDeveloper(adminId: number, id: number) {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundException('REAL_ESTATE_DEVELOPER_NOT_FOUND');
    }

    // Collect all projects and cascade
    const projects = await this.repo.findProjectsWithAttachments(id);
    const projectIds = projects.map((p) => p.id);

    if (projectIds.length > 0) {
      // Delete listings linked to these projects
      const linkedListings = await this.repo.findListingsByProjectIds(projectIds);
      const listingIds = linkedListings.map((l) => l.id);

      if (listingIds.length > 0) {
        const listingAttachments = await this.repo.findListingAttachmentKeys(listingIds);
        await Promise.all(listingAttachments.map((a) => this.s3.deleteByKey(a.key)));
        await this.repo.deleteAttachmentsByIds(listingAttachments.map((a) => a.id));
        await this.repo.deleteListingsByIds(listingIds);
      }

      // Delete project attachments
      const projectAttachments = await this.repo.findProjectAttachmentKeys(projectIds);
      await Promise.all(projectAttachments.map((a) => this.s3.deleteByKey(a.key)));
      await this.repo.deleteAttachmentsByIds(projectAttachments.map((a) => a.id));

      await this.repo.deleteProjectsByIds(projectIds);
    }

    // Delete developer logo from S3 then the developer row
    if (existing.logo) {
      await this.s3.delete(existing.logo);
    }
    await this.repo.delete(id);

    this.logger.warn(
      { action: LogAction.ADMIN_DEVELOPER_DELETED, adminId, developerId: id },
      'Admin deleted real estate developer',
    );

    return { id, deleted: true };
  }
}
