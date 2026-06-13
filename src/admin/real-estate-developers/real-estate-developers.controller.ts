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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { SkipTranslation } from 'src/common/decorators/skip-translation.decorator';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';
import { CurrentAdmin } from '../auth/decorators/current-admin.decorator';
import { AuthenticatedAdmin } from '../auth/interfaces/authenticated-admin.interface';
import { imageUploadInterceptorOptions } from 'src/modules/storage/upload.config';
import { DevelopersService } from './developers.service';
import { DeveloperQueryDto } from './dto/developer-query.dto';
import { CreateDeveloperDto } from './dto/create-developer.dto';
import { UpdateDeveloperDto } from './dto/update-developer.dto';

@UseGuards(AdminJwtAuthGuard)
@SkipTranslation()
@Controller('')
export class RealEstateDevelopersController {
  constructor(private readonly service: DevelopersService) {}

  @Get()
  async getDevelopers(@Query() query: DeveloperQueryDto) {
    return this.service.getDevelopers(query);
  }

  @Post()
  @UseInterceptors(FileInterceptor('logo', imageUploadInterceptorOptions))
  async createDeveloper(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Body() dto: CreateDeveloperDto,
    @UploadedFile() logo: Express.Multer.File,
  ) {
    return this.service.createDeveloper(admin.id, dto, logo);
  }

  @Get(':id')
  async getDeveloperById(@Param('id', ParseIntPipe) id: number) {
    return this.service.getDeveloperById(id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('logo', imageUploadInterceptorOptions))
  async updateDeveloper(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDeveloperDto,
    @UploadedFile() logo: Express.Multer.File,
  ) {
    return this.service.updateDeveloper(admin.id, id, dto, logo);
  }

  @Delete(':id')
  async deleteDeveloper(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.deleteDeveloper(admin.id, id);
  }
}
