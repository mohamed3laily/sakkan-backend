import {
  Body,
  Controller,
  Req,
  Post,
  Get,
  UseGuards,
  Query,
  UseInterceptors,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ListingService } from './listing.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ListingQueryDto } from './dto/listing-query.dto';
import { TranslateInterceptor } from 'src/common/interceptors/translate.interceptor';

@UseGuards(JwtAuthGuard)
@Controller('listings')
export class ListingController {
  constructor(private readonly service: ListingService) {}

  @Post()
  async create(@Req() req: any, @Body() dto: CreateListingDto) {
    const userId = req.user.id;
    return this.service.createListing(userId, dto);
  }

  @UseInterceptors(TranslateInterceptor)
  @Get()
  async getListings(@Query() query: ListingQueryDto) {
    return this.service.getListings(query);
  }

  @UseInterceptors(TranslateInterceptor)
  @Get(':id')
  async getListingById(@Param('id', ParseIntPipe) id: number) {
    return this.service.getListingById(id);
  }
}
