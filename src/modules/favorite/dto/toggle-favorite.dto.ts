import { IsEnum, IsInt, IsPositive } from 'class-validator';
import { FavoritableType, FavoritableTypeEnum } from '../enums';

export class ToggleFavoriteDto {
  @IsEnum(FavoritableTypeEnum)
  favoritableType: FavoritableType;

  @IsInt()
  @IsPositive()
  favoritableId: number;
}
