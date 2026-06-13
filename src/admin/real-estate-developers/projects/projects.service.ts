import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { LogAction } from 'src/common/logging';
import { AttachmentService } from 'src/modules/attachment/attachment.service';
import { S3Service } from 'src/modules/storage/s3.service';
import { ProjectsRepo } from './projects.repo';
import { ProjectQueryDto } from './dto/project-query.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    private readonly repo: ProjectsRepo,
    private readonly attachmentService: AttachmentService,
    private readonly s3: S3Service,
  ) {}

  async getProjects(query: ProjectQueryDto) {
    return this.repo.findAll(query);
  }

  async getProjectById(id: number) {
    const project = await this.repo.findById(id);
    if (!project) {
      throw new NotFoundException('DEVELOPER_PROJECT_NOT_FOUND');
    }
    return project;
  }

  async createProject(
    adminId: number,
    dto: CreateProjectDto,
    imageFiles?: Express.Multer.File[],
  ) {
    if (!imageFiles || imageFiles.length === 0) {
      throw new BadRequestException('DEVELOPER_PROJECT_IMAGE_REQUIRED');
    }

    await this.validateForeignKeys(dto.developerId, dto.cityId, dto.areaId);

    const project = await this.repo.create(dto);
    await this.attachmentService.createMany('DEVELOPER_PROJECT', project.id, imageFiles);

    this.logger.log(
      { action: LogAction.ADMIN_DEVELOPER_PROJECT_CREATED, adminId, projectId: project.id },
      'Admin created developer project',
    );

    return this.repo.findById(project.id);
  }

  async updateProject(
    adminId: number,
    id: number,
    dto: UpdateProjectDto,
    imageFiles?: Express.Multer.File[],
  ) {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundException('DEVELOPER_PROJECT_NOT_FOUND');
    }

    if (dto.developerId || dto.cityId || dto.areaId) {
      const developerId = dto.developerId ?? existing.developerId;
      const cityId = dto.cityId ?? existing.city?.id ?? 0;
      await this.validateForeignKeys(developerId, cityId, dto.areaId);
    }

    const removeIds = dto.removeAttachmentIds ?? [];
    if (removeIds.length > 0) {
      const valid = await this.repo.validateAttachmentIds(id, removeIds);
      if (!valid) {
        throw new BadRequestException('INVALID_ATTACHMENT_IDS');
      }
    }

    await this.repo.update(id, dto);

    if (removeIds.length > 0) {
      const attachmentRows = await this.repo.findProjectAttachments(id);
      const toRemove = attachmentRows.filter((a) => removeIds.includes(a.id));
      await Promise.all(toRemove.map((a) => this.s3.deleteByKey(a.key)));
      await this.repo.deleteAttachmentsByIds(removeIds);
    }

    if (imageFiles && imageFiles.length > 0) {
      await this.attachmentService.createMany('DEVELOPER_PROJECT', id, imageFiles);
    }

    this.logger.log(
      { action: LogAction.ADMIN_DEVELOPER_PROJECT_UPDATED, adminId, projectId: id },
      'Admin updated developer project',
    );

    return this.repo.findById(id);
  }

  async deleteProject(adminId: number, id: number) {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundException('DEVELOPER_PROJECT_NOT_FOUND');
    }

    // Cascade: listings linked to this project
    const linkedListings = await this.repo.findListingsByProjectId(id);
    const listingIds = linkedListings.map((l) => l.id);

    if (listingIds.length > 0) {
      const listingAttachments = await this.repo.findListingAttachmentKeys(listingIds);
      await Promise.all(listingAttachments.map((a) => this.s3.deleteByKey(a.key)));
      await this.repo.deleteAttachmentsByIds(listingAttachments.map((a) => a.id));
      await this.repo.deleteListingsByIds(listingIds);
    }

    // Delete project attachments
    const projectAttachments = await this.repo.findProjectAttachments(id);
    await Promise.all(projectAttachments.map((a) => this.s3.deleteByKey(a.key)));
    await this.repo.deleteAttachmentsByIds(projectAttachments.map((a) => a.id));

    await this.repo.delete(id);

    this.logger.warn(
      { action: LogAction.ADMIN_DEVELOPER_PROJECT_DELETED, adminId, projectId: id },
      'Admin deleted developer project',
    );

    return { id, deleted: true };
  }

  private async validateForeignKeys(developerId: number, cityId: number, areaId?: number) {
    const [developer, city] = await Promise.all([
      this.repo.findDeveloperById(developerId),
      this.repo.findCityById(cityId),
    ]);

    if (!developer) {
      throw new NotFoundException('REAL_ESTATE_DEVELOPER_NOT_FOUND');
    }
    if (!city) {
      throw new NotFoundException('CITY_NOT_FOUND');
    }

    if (areaId) {
      const area = await this.repo.findAreaByCityAndId(cityId, areaId);
      if (!area) {
        throw new BadRequestException('AREA_CITY_MISMATCH');
      }
    }
  }
}
