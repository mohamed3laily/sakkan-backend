import { IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

import { PaginationDto } from 'src/common/dto/pagination.dto';

export class ProjectQueryDto extends PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  developerId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  cityId?: number;

  @IsOptional()
  @IsString()
  search?: string;
}
