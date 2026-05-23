import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ListingsRepo } from './listings.repo';
import { ListingQueryDto } from 'src/modules/listing/dto/listing-query.dto';
import { ListingFiltersDto } from './dto/listing-filters.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ListingSortDto } from './dto/listing-sort.dto';
import { PaginationService } from 'src/common/services/pagination.service';
import { UpdateListingStatusDto } from './dto/update-listing-status.dto';
import { LogAction } from 'src/common/logging';

@Injectable()
export class ListingsService {
  private readonly logger = new Logger(ListingsService.name);

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

  async deleteListing(adminId: number, listingId: number) {
    await this.repo.delete(listingId);

    this.logger.warn(
      ({
        action: LogAction.ADMIN_LISTING_DELETED,
        adminId,
        listingId,
      }),
      'Admin deleted listing',
    );

    return { success: true };
  }

  async updateStatus(adminId: number, listingId: number, dto: UpdateListingStatusDto) {
    const result = await this.repo.updateStatus(listingId, dto.status);
    if (!result) throw new NotFoundException(`Listing ${listingId} not found`);

    this.logger.log(
      ({
        action: LogAction.ADMIN_LISTING_STATUS_UPDATED,
        adminId,
        listingId,
        status: dto.status,
      }),
      'Admin updated listing status',
    );

    return result;
  }
}
