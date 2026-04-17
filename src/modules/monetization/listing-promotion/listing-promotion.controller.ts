import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import type { QuotaCheckResult } from '../types';
import { ListingPromotionService } from './listing-promotion.service';
import { TranslateInterceptor } from 'src/common/interceptors/translate.interceptor';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TranslateInterceptor)
export class ListingPromotionController {
  constructor(private readonly listingPromotionService: ListingPromotionService) {}

  @Get('quota/check/:type')
  checkQuota(
    @Param('type') type: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<QuotaCheckResult> {
    const creditType = this.listingPromotionService.parseCreditTypeParam(type);
    return this.listingPromotionService.checkQuota(user.id, creditType);
  }

  @Post('listings/:id/make-featured')
  @HttpCode(HttpStatus.OK)
  makeFeatured(
    @Param('id', ParseIntPipe) listingId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.listingPromotionService.makeFeatured(user.id, listingId);
  }

  @Post('listings/:id/make-serious')
  @HttpCode(HttpStatus.OK)
  makeSerious(
    @Param('id', ParseIntPipe) listingId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.listingPromotionService.makeSerious(user.id, listingId);
  }
}
