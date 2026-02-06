import { Injectable } from '@nestjs/common';
import { CreateListingDto } from './dto/create-listing.dto';
import { ListingsRepository } from './listing.repo';

@Injectable()
export class ListingService {
  constructor(private readonly repo: ListingsRepository) {}

  async createListing(userId: number, dto: CreateListingDto) {
    return this.repo.create(userId, dto);
  }
}
