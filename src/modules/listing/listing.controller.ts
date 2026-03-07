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
import { PropertyTypeQueryDto } from './dto/property-type-query.dto';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from 'src/common/decorators/public.decorator';

@UseGuards(JwtAuthGuard)
@Controller('listings')
export class ListingController {
  constructor(private readonly service: ListingService) {}

  @Public()
  @UseInterceptors(TranslateInterceptor)
  @Get('/property-types')
  async getPropertyTypes(@Query() query: PropertyTypeQueryDto) {
    return this.service.getPropertyTypes(query);
  }

  @Post()
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateListingDto) {
    const userId = user.id;
    return this.service.createListing(userId, dto);
  }

  @Public()
  @UseInterceptors(TranslateInterceptor)
  @Get()
  async getListings(@CurrentUser() user: AuthenticatedUser, @Query() query: ListingQueryDto) {
    return this.service.getListings(query, user?.id);
  }

  @Public()
  @UseInterceptors(TranslateInterceptor)
  @Get(':id')
  async getListingById(@Param('id', ParseIntPipe) id: number) {
    return this.service.getListingById(id);
  }
}
