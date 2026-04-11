import { PropertyTypeQueryDto } from './dto/property-type-query.dto';

import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateListingDto } from './dto/create-listing.dto';
import { ListingsRepository } from './listing.repo';
import { ListingFiltersDto } from './dto/listing-filters.dto';
import { ListingSortDto } from './dto/listing-sort.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ListingQueryDto } from './dto/listing-query.dto';
import { PaginationService } from 'src/common/services/pagination.service';
import { CityQueue } from '../city/city.queue';
import { GeoValidationService } from './geo-validation.service';
import { AttachmentService } from '../attachment/attachment.service';

@Injectable()
export class ListingService {
  constructor(
    private readonly repo: ListingsRepository,
    private readonly paginationService: PaginationService,
    private readonly cityQueue: CityQueue,
    private readonly geoValidationService: GeoValidationService,
    private readonly attachmentService: AttachmentService,
  ) {}

  async createListing(userId: number, dto: CreateListingDto, images: Express.Multer.File[] = []) {
    await this.geoValidationService.validateListingLocation(dto);

    const listing = await this.repo.create(userId, dto);

    const [_] = await Promise.all([
      images.length > 0 && this.attachmentService.createMany('LISTING', listing.id, images),
      this.cityQueue.incrementListingCount(dto.cityId),
    ]);

    return listing;
  }

  async getListings(query: ListingQueryDto, userId?: number) {
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

    const { data, total } = await this.repo.findAll(filters, sort, pagination, userId);
    return this.paginationService.createPaginatedResponse(data, total, page, limit);
  }

  async getListingById(id: number) {
    const listing = await this.repo.findById(id);

    if (!listing) {
      throw new NotFoundException(`Listing with ID ${id} not found`);
    }

    return listing;
  }

  async getPropertyTypes(query: PropertyTypeQueryDto) {
    return this.repo.getPropertyTypes(query.parent);
  }
}
