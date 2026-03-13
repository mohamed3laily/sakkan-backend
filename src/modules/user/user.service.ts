import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepo } from './user.repo';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ListingSortDto } from './dto/listing-sort.dto';
import { ListingQueryDto } from './dto/listing-query.dto';
import { ListingFiltersDto } from './dto/listing-filters.dto';
import { PaginationService } from 'src/common/services/pagination.service';

@Injectable()
export class UserService {
  constructor(
    private userRepo: UserRepo,
    private readonly paginationService: PaginationService,
  ) {}

  async getUserById(id: number) {
    return this.userRepo.getUserById(id);
  }

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

    const { data, total } = await this.userRepo.findAllListings(filters, sort, pagination, userId);
    return this.paginationService.createPaginatedResponse(data, total, page, limit);
  }

  async getListingById(id: number, userId: number) {
    const listing = await this.userRepo.findListingById(id, userId);

    if (!listing) {
      throw new NotFoundException(`Listing with ID ${id} not found`);
    }

    return listing;
  }
}
