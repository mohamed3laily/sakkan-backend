import { Injectable, NotFoundException } from '@nestjs/common';
import { ListingsRepo } from './listings.repo';
import { ListingQueryDto } from './dto/listing-query.dto';
import { ListingFiltersDto } from './dto/listing-filters.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ListingSortDto } from './dto/listing-sort.dto';
import { PaginationService } from 'src/common/services/pagination.service';

@Injectable()
export class ListingsService {
  constructor(
    private readonly repo: ListingsRepo,
    private readonly paginationService: PaginationService,
  ) {}

  async getListings(query: ListingQueryDto) {
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
    return this.paginationService.createPaginatedResponse(data, total, page, limit);
  }

  async getListingById(id: number) {
    const listing = await this.repo.findById(id);
    if (!listing) {
      throw new NotFoundException(`Listing with ID ${id} not found`);
    }
    return listing;
  }

  async deleteListing(id: number) {
    await this.repo.delete(id);
    return { success: true };
  }

  async toggleUnlist(id: number) {
    const result = await this.repo.toggleUnlist(id);
    if (!result) throw new NotFoundException(`Listing ${id} not found`);

    return {
      id,
      unlisted: result.unlistedAt !== null,
      unlistedAt: result.unlistedAt,
    };
  }
}
