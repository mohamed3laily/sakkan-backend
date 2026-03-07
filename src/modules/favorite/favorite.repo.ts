import { Injectable } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DrizzleService } from '../db/drizzle.service';
import { favorites } from '../db/schemas/favorites/favorite';
import { FavoritableType } from './enums';

@Injectable()
export class FavoriteRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findExisting(userId: number, favoritableType: FavoritableType, favoritableId: number) {
    const result = await this.drizzle.db
      .select()
      .from(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites.favoritableType, favoritableType),
          eq(favorites.favoritableId, favoritableId),
        ),
      )
      .limit(1);

    return result[0] || null;
  }

  async create(userId: number, favoritableType: FavoritableType, favoritableId: number) {
    await this.drizzle.db.insert(favorites).values({
      userId,
      favoritableType,
      favoritableId,
    });
  }

  async delete(id: number) {
    await this.drizzle.db.delete(favorites).where(eq(favorites.id, id));
  }
}
