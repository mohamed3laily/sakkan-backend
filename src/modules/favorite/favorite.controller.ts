import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { FavoriteService } from './favorite.service';
import { ToggleFavoriteDto } from './dto/toggle-favorite.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@UseGuards(JwtAuthGuard)
@Controller('favorites')
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @Post('toggle')
  async toggle(@CurrentUser() user: AuthenticatedUser, @Body() dto: ToggleFavoriteDto) {
    return this.favoriteService.toggle(user.id, dto);
  }
}
