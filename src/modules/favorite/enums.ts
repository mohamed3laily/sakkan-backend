import { favoritableTypeEnum } from '../db/schemas/favorites/enums';

export type FavoritableType = (typeof favoritableTypeEnum.enumValues)[number];

export const FavoritableTypeEnum = favoritableTypeEnum.enumValues;
