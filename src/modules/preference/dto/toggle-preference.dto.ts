import { IsEnum, IsInt, IsPositive } from 'class-validator';
import { PreferableType } from 'src/modules/db/schemas/preferences/enums';

export class TogglePreferencesDto {
  @IsEnum(['AREA', 'PROPERTY_TYPE'])
  preferableType: PreferableType;

  @IsInt({ each: true })
  @IsPositive({ each: true })
  preferableIds: number[];
}
