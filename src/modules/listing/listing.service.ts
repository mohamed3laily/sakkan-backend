import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateListingDto } from './dto/create-listing.dto';
import { ListingsRepository } from './listing.repo';
import { ListingFiltersDto } from './dto/listing-filters.dto';
import { ListingSortDto } from './dto/listing-sort.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ListingQueryDto } from './dto/listing-query.dto';
import { PaginationService } from 'src/common/services/pagination.service';
import { PaginatedResponse } from 'src/common/types/pagination.types';
import { listings } from '../db/schemas/listing/listing';

@Injectable()
export class ListingService {
  constructor(
    private readonly repo: ListingsRepository,
    private readonly paginationService: PaginationService,
  ) {}

  async createListing(userId: number, dto: CreateListingDto) {
    return this.repo.create(userId, dto);
  }

  async getListings(
    query: ListingQueryDto,
  ): Promise<PaginatedResponse<typeof listings.$inferSelect>> {
    const { page = 1, limit = 10, sortBy, order, ...filterFields } = query;

    const filters: ListingFiltersDto = filterFields;

    const sort: ListingSortDto = {
      sortBy,
      order,
    };

    const pagination: PaginationDto = {
      page,
      limit,
    };

    const { data, total } = await this.repo.findAll(filters, sort, pagination);
    return this.paginationService.createPaginatedResponse(
      data,
      total,
      page,
      limit,
    );
  }

  async getListingById(id: number) {
    const listing = await this.repo.findById(id);

    if (!listing) {
      throw new NotFoundException(`Listing with ID ${id} not found`);
    }

    return listing;
  }
}
