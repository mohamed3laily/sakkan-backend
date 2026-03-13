import { IntersectionType } from '@nestjs/mapped-types';
import { ListingFiltersDto } from './listing-filters.dto';
import { ListingSortDto } from './listing-sort.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class ListingQueryDto extends IntersectionType(
  ListingFiltersDto,
  ListingSortDto,
  PaginationDto,
) {}
