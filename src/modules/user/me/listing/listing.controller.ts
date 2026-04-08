import {
  Controller,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
  UseInterceptors,
  Get,
  Delete,
} from '@nestjs/common';
import { TranslateInterceptor } from 'src/common/interceptors/translate.interceptor';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from 'src/modules/auth/interfaces/authenticated-user.interface';
import { ListingQueryDto } from './dto/listing-query.dto';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { ListingService } from './listing.service';

@Controller('')
export class ListingController {
  constructor(private service: ListingService) {}
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(TranslateInterceptor)
  @Get()
  async getListings(@CurrentUser() user: AuthenticatedUser, @Query() query: ListingQueryDto) {
    return this.service.getListings(query, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(TranslateInterceptor)
  @Get('/:id')
  async getListingById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.getListingById(id, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/:id')
  async deleteListingById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.deleteListingById(id, user.id);
  }
}
