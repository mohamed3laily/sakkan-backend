import { IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

import { PaginationDto } from 'src/common/dto/pagination.dto';

export class DeveloperProjectsQueryDto extends PaginationDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  developerId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  cityId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  areaId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  propertyTypeId?: number;
}
