import { Injectable, NotFoundException } from '@nestjs/common';

import { PaginationService } from 'src/common/services/pagination.service';
import { DeveloperProjectsQueryDto } from './dto/developer-projects-query.dto';
import { DevelopersQueryDto } from './dto/developers-query.dto';
import { RealEstateDeveloperRepository } from './real-estate-developer.repo';

@Injectable()
export class RealEstateDeveloperService {
  constructor(
    private readonly repo: RealEstateDeveloperRepository,
    private readonly paginationService: PaginationService,
  ) {}

  async getDevelopers(query: DevelopersQueryDto) {
    const { page = 1, limit = 10 } = query;
    const { data, total } = await this.repo.findAllDevelopers(query);
    return this.paginationService.createPaginatedResponse(data, total, page, limit);
  }

  async getProjects(query: DeveloperProjectsQueryDto) {
    const { page = 1, limit = 10 } = query;
    const { data, total } = await this.repo.findAllProjects(query);
    return this.paginationService.createPaginatedResponse(data, total, page, limit);
  }

  async getProjectById(id: number) {
    const project = await this.repo.findProjectById(id);
    if (!project) {
      throw new NotFoundException('DEVELOPER_PROJECT_NOT_FOUND');
    }
    return project;
  }
}
