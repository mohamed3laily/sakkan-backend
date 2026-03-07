import { Injectable } from '@nestjs/common';
import { ToggleFavoriteDto } from './dto/toggle-favorite.dto';
import { FavoriteRepository } from './favorite.repo';

@Injectable()
export class FavoriteService {
  constructor(private readonly favoriteRepository: FavoriteRepository) {}

  async toggle(userId: number, dto: ToggleFavoriteDto) {
    const existing = await this.favoriteRepository.findExisting(userId, dto.favoritableType, dto.favoritableId);

    if (existing) {
      await this.favoriteRepository.delete(existing.id);
      return { isFavorited: false };
    }

    await this.favoriteRepository.create(userId, dto.favoritableType, dto.favoritableId);

    return { isFavorited: true };
  }
}
