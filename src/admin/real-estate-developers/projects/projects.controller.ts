import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';

import { SkipTranslation } from 'src/common/decorators/skip-translation.decorator';
import { AdminJwtAuthGuard } from '../../auth/guards/admin-jwt-auth.guard';
import { CurrentAdmin } from '../../auth/decorators/current-admin.decorator';
import { AuthenticatedAdmin } from '../../auth/interfaces/authenticated-admin.interface';
import { imageUploadInterceptorOptions } from 'src/modules/storage/upload.config';
import { ProjectsService } from './projects.service';
import { ProjectQueryDto } from './dto/project-query.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@UseGuards(AdminJwtAuthGuard)
@SkipTranslation()
@Controller('projects')
export class ProjectsController {
  constructor(private readonly service: ProjectsService) {}

  @Get()
  async getProjects(@Query() query: ProjectQueryDto) {
    return this.service.getProjects(query);
  }

  @Post()
  @UseInterceptors(FilesInterceptor('images', 6, imageUploadInterceptorOptions))
  async createProject(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Body() dto: CreateProjectDto,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    return this.service.createProject(admin.id, dto, images);
  }

  @Get(':id')
  async getProjectById(@Param('id', ParseIntPipe) id: number) {
    return this.service.getProjectById(id);
  }

  @Patch(':id')
  @UseInterceptors(FilesInterceptor('images', 6, imageUploadInterceptorOptions))
  async updateProject(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProjectDto,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    return this.service.updateProject(admin.id, id, dto, images);
  }

  @Delete(':id')
  async deleteProject(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.deleteProject(admin.id, id);
  }
}
