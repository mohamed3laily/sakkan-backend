import { Module } from '@nestjs/common';
import { FavoriteService } from './favorite.service';
import { FavoriteController } from './favorite.controller';
import { FavoriteRepository } from './favorite.repo';

@Module({
  providers: [FavoriteService, FavoriteRepository],
  controllers: [FavoriteController],
})
export class FavoriteModule {}
