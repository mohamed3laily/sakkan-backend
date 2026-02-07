import { IsEnum, IsOptional } from 'class-validator';

export enum ListingSortBy {
  CREATED_AT = 'createdAt',
  PRICE = 'price',
  SPACE = 'spaceSqm',
  IS_SERIOUS = 'isSerious',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class ListingSortDto {
  @IsOptional()
  @IsEnum(ListingSortBy)
  sortBy?: ListingSortBy = ListingSortBy.CREATED_AT;

  @IsOptional()
  @IsEnum(SortOrder)
  order?: SortOrder = SortOrder.DESC;
}
