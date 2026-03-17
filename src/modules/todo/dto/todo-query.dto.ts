import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export const TODO_STATUS = {
  TODAY: 'TODAY',
  INCOMING: 'INCOMING',
  MISSED: 'MISSED',
  NO_DUE_DATE: 'NO_DUE_DATE',
  COMPLETED: 'COMPLETED',
} as const;

export type TodoStatus = (typeof TODO_STATUS)[keyof typeof TODO_STATUS];

export class TodoQueryDto extends PaginationDto {
  @IsOptional()
  @IsIn(Object.values(TODO_STATUS))
  status?: TodoStatus;

  @IsOptional()
  @IsString()
  search?: string;
}
