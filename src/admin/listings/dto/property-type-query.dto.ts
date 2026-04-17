import { IsOptional, IsEnum } from 'class-validator';
import { PropertyParentType } from '../../../modules/listing/enum/listing.enums';

export class PropertyTypeQueryDto {
  @IsOptional()
  @IsEnum(PropertyParentType)
  parent?: PropertyParentType;
}
