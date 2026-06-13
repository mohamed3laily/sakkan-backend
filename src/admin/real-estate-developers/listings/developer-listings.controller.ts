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
import { DeveloperListingsService } from './developer-listings.service';
import { DeveloperListingQueryDto } from './dto/developer-listing-query.dto';
import { CreateDeveloperListingDto } from './dto/create-developer-listing.dto';
import { UpdateDeveloperListingDto } from './dto/update-developer-listing.dto';

@UseGuards(AdminJwtAuthGuard)
@SkipTranslation()
@Controller('listings')
export class DeveloperListingsController {
  constructor(private readonly service: DeveloperListingsService) {}

  @Get()
  async getListings(@Query() query: DeveloperListingQueryDto) {
    return this.service.getListings(query);
  }

  @Post()
  @UseInterceptors(FilesInterceptor('images', 6, imageUploadInterceptorOptions))
  async createListing(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Body() dto: CreateDeveloperListingDto,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    return this.service.createListing(admin.id, dto, images);
  }

  @Get(':id')
  async getListingById(@Param('id', ParseIntPipe) id: number) {
    return this.service.getListingById(id);
  }

  @Patch(':id')
  @UseInterceptors(FilesInterceptor('images', 6, imageUploadInterceptorOptions))
  async updateListing(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDeveloperListingDto,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    return this.service.updateListing(admin.id, id, dto, images);
  }

  @Delete(':id')
  async deleteListing(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.deleteListing(admin.id, id);
  }
}
