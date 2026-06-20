import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { LogAction } from 'src/common/logging';
import { PaginationService } from 'src/common/services/pagination.service';
import { AttachmentService } from 'src/modules/attachment/attachment.service';
import { S3Service } from 'src/modules/storage/s3.service';
import { DeveloperListingsRepo } from './developer-listings.repo';
import { DeveloperListingQueryDto } from './dto/developer-listing-query.dto';
import { CreateDeveloperListingDto } from './dto/create-developer-listing.dto';
import { UpdateDeveloperListingDto } from './dto/update-developer-listing.dto';

@Injectable()
export class DeveloperListingsService {
  private readonly logger = new Logger(DeveloperListingsService.name);

  constructor(
    private readonly repo: DeveloperListingsRepo,
    private readonly paginationService: PaginationService,
    private readonly attachmentService: AttachmentService,
    private readonly s3: S3Service,
  ) {}

  async getListings(query: DeveloperListingQueryDto) {
    const { page = 1, limit = 10 } = query;
    const { data, total } = await this.repo.findAll(query);
    return this.paginationService.createPaginatedResponse(data, total, page, limit);
  }

  async getListingById(id: number) {
    const listing = await this.repo.findById(id);
    if (!listing) {
      throw new NotFoundException('DEVELOPER_LISTING_NOT_FOUND');
    }
    return listing;
  }

  async createListing(
    adminId: number,
    dto: CreateDeveloperListingDto,
    imageFiles?: Express.Multer.File[],
  ) {
    if (!imageFiles || imageFiles.length === 0) {
      throw new BadRequestException('DEVELOPER_LISTING_IMAGE_REQUIRED');
    }

    const project = await this.repo.findProjectById(dto.projectId);
    if (!project) {
      throw new NotFoundException('DEVELOPER_PROJECT_NOT_FOUND');
    }

    const listing = await this.repo.create(dto, project);
    await this.attachmentService.createMany('LISTING', listing.id, imageFiles);

    this.logger.log(
      { action: LogAction.ADMIN_DEVELOPER_LISTING_CREATED, adminId, listingId: listing.id },
      'Admin created developer listing',
    );

    return this.repo.findById(listing.id);
  }

  async updateListing(
    adminId: number,
    id: number,
    dto: UpdateDeveloperListingDto,
    imageFiles?: Express.Multer.File[],
  ) {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundException('DEVELOPER_LISTING_NOT_FOUND');
    }

    let project: { cityId: number; areaId: number | null } | undefined;
    if (dto.projectId !== undefined) {
      const foundProject = await this.repo.findProjectById(dto.projectId);
      if (!foundProject) {
        throw new NotFoundException('DEVELOPER_PROJECT_NOT_FOUND');
      }
      project = foundProject;
    }

    if (dto.propertyTypeId !== undefined) {
      const propertyType = await this.repo.findPropertyTypeById(dto.propertyTypeId);
      if (!propertyType) {
        throw new NotFoundException('PROPERTY_TYPE_NOT_FOUND');
      }
    }

    const updated = await this.repo.update(id, dto, project);
    if (!updated) {
      throw new NotFoundException('DEVELOPER_LISTING_NOT_FOUND');
    }

    if (imageFiles && imageFiles.length > 0) {
      await this.attachmentService.createMany('LISTING', id, imageFiles);
    }

    this.logger.log(
      { action: LogAction.ADMIN_DEVELOPER_LISTING_UPDATED, adminId, listingId: id },
      'Admin updated developer listing',
    );

    return this.repo.findById(id);
  }

  async deleteListing(adminId: number, id: number) {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundException('DEVELOPER_LISTING_NOT_FOUND');
    }

    const listingAttachments = await this.repo.findListingAttachments(id);
    await Promise.all(listingAttachments.map((a) => this.s3.deleteByKey(a.key)));
    await this.repo.deleteAttachmentsByIds(listingAttachments.map((a) => a.id));

    const deleted = await this.repo.delete(id);
    if (!deleted) {
      throw new NotFoundException('DEVELOPER_LISTING_NOT_FOUND');
    }

    this.logger.warn(
      { action: LogAction.ADMIN_DEVELOPER_LISTING_DELETED, adminId, listingId: id },
      'Admin deleted developer listing',
    );

    return { id, deleted: true };
  }
}
