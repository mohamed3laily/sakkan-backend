import { IsEnum, IsInt, IsPositive } from 'class-validator';
import { PreferableType } from 'src/modules/db/schemas/preferences/enums';

export class TogglePreferenceDto {
  @IsEnum(['AREA', 'PROPERTY_TYPE'])
  preferableType: PreferableType;

  @IsInt()
  @IsPositive()
  preferableId: number;
}
