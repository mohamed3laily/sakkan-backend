import {
  Controller,
  Get,
  Query,
  Param,
  ParseIntPipe,
  UseGuards,
  Delete,
  Patch,
} from '@nestjs/common';
import { ListingsService } from './listings.service';
import { ListingQueryDto } from 'src/modules/listing/dto/listing-query.dto';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';

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
  @Delete(':id')
  async deleteListing(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteListing(id);
  }

  @Patch(':id/unlist')
  async toggleUnlist(@Param('id', ParseIntPipe) id: number) {
    return this.service.toggleUnlist(id);
  }
}
