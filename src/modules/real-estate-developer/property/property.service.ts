import { Injectable, NotFoundException } from '@nestjs/common';

import { PaginationService } from 'src/common/services/pagination.service';
import { ProjectPropertiesQueryDto } from './dto/project-properties-query.dto';
import { PropertyRepository } from './property.repo';

@Injectable()
export class PropertyService {
  constructor(
    private readonly repo: PropertyRepository,
    private readonly paginationService: PaginationService,
  ) {}

  async getProjectProperties(projectId: number, query: ProjectPropertiesQueryDto, userId?: number) {
    const { page = 1, limit = 20 } = query;
    const { data, total } = await this.repo.findByProjectId(projectId, query, userId);
    return this.paginationService.createPaginatedResponse(data, total, page, limit);
  }

  async getProjectPropertyById(projectId: number, propertyId: number, userId?: number) {
    const row = await this.repo.findOneInProject(projectId, propertyId, userId);
    if (!row) {
      throw new NotFoundException('LISTING_NOT_FOUND');
    }
    return row;
  }
}
