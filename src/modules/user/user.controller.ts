import {
  Controller,
  Query,
  Get,
  UseInterceptors,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { TranslateInterceptor } from 'src/common/interceptors/translate.interceptor';
import { UserService } from './user.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { ListingQueryDto } from './dto/listing-query.dto';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UserController {
  constructor(private service: UserService) {}

  @UseInterceptors(TranslateInterceptor)
  @UseGuards(JwtAuthGuard)
  @Get('my-listings')
  async getListings(@CurrentUser() user: AuthenticatedUser, @Query() query: ListingQueryDto) {
    return this.service.getListings(query, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(TranslateInterceptor)
  @Get('my-listings/:id')
  async getListingById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.getListingById(id, user.id);
  }
}
