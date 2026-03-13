import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginationService } from 'src/common/services/pagination.service';
import { ListingRepository } from './listing.repository';
import { ListingFiltersDto } from './dto/listing-filters.dto';
import { ListingQueryDto } from './dto/listing-query.dto';
import { ListingSortDto } from './dto/listing-sort.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class ListingService {
  constructor(
    private listingRepo: ListingRepository,
    private readonly paginationService: PaginationService,
  ) {}
  async getListings(query: ListingQueryDto, userId: number) {
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

    const { data, total } = await this.listingRepo.findAll(filters, sort, pagination, userId);
    return this.paginationService.createPaginatedResponse(data, total, page, limit);
  }

  async getListingById(id: number, userId: number) {
    const listing = await this.listingRepo.findById(id, userId);

    if (!listing) {
      throw new NotFoundException('LISTING_NOT_FOUND');
    }

    return listing;
  }

  async deleteListingById(id: number, userId: number) {
    const deleted = await this.listingRepo.deleteById(id, userId);

    if (!deleted) throw new NotFoundException('LISTING_NOT_FOUND');

    return { message: 'LISTING_DELETED' };
  }
}
