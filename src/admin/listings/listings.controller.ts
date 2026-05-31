import {
  Controller,
  Get,
  Query,
  Param,
  ParseIntPipe,
  UseGuards,
  Delete,
  Patch,
  Body,
} from '@nestjs/common';
import { ListingsService } from './listings.service';
import { ListingQueryDto } from 'src/modules/listing/dto/listing-query.dto';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';
import { UpdateListingStatusDto } from './dto/update-listing-status.dto';
import { CurrentAdmin } from '../auth/decorators/current-admin.decorator';
import { AuthenticatedAdmin } from '../auth/interfaces/authenticated-admin.interface';

@UseGuards(AdminJwtAuthGuard)
@Controller('')
export class ListingsController {
  constructor(private readonly service: ListingsService) {}

  @Get()
  async getListings(@Query() query: ListingQueryDto) {
    return this.service.getListings(query);
  }

  @Get(':id')
  async getListingById(@Param('id', ParseIntPipe) id: number) {
    return this.service.getListingById(id);
  }

  @Patch(':id/status')
  async updateStatus(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateListingStatusDto,
  ) {
    return this.service.updateStatus(admin.id, id, dto);
  }

  @Delete(':id')
  async deleteListing(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.deleteListing(admin.id, id);
  }
}
