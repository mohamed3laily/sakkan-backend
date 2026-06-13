import { IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

import { PaginationDto } from 'src/common/dto/pagination.dto';

export class DeveloperListingQueryDto extends PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  projectId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  developerId?: number;

  @IsOptional()
  @IsString()
  search?: string;
}
