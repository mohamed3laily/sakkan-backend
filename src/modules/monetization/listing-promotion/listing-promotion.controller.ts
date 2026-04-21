import {
  Controller,
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
import { ListingPromotionService } from './listing-promotion.service';
import { TranslateInterceptor } from 'src/common/interceptors/translate.interceptor';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TranslateInterceptor)
export class ListingPromotionController {
  constructor(private readonly listingPromotionService: ListingPromotionService) {}

  /**
   * Reveal (unlock) the contact details of a serious-request listing.
   * Burns one view from the subscriber's monthly quota; re-revealing is free.
   */
  @Post('listings/:id/reveal-serious')
  @HttpCode(HttpStatus.OK)
  revealSeriousRequest(
    @Param('id', ParseIntPipe) listingId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.listingPromotionService.revealSeriousRequest(listingId, user.id);
  }
}
