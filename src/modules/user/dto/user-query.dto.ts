import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class UserQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;
}
