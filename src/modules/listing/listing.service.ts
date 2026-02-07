import { Injectable } from '@nestjs/common';
import { CreateListingDto } from './dto/create-listing.dto';
import { ListingsRepository } from './listing.repo';
import { ListingFiltersDto } from './dto/listing-filters.dto';
import { ListingSortDto } from './dto/listing-sort.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ListingQueryDto } from './dto/listing-query.dto';

@Injectable()
export class ListingService {
  constructor(private readonly repo: ListingsRepository) {}

  async createListing(userId: number, dto: CreateListingDto) {
    return this.repo.create(userId, dto);
  }

  async getListings(query: ListingQueryDto) {
    const { page, limit, sortBy, order, ...filterFields } = query;

    const filters: ListingFiltersDto = filterFields;

    const sort: ListingSortDto = {
      sortBy,
      order,
    };

    const pagination: PaginationDto = {
      page,
      limit,
    };

    return this.repo.findAll(filters, sort);
  }
}
