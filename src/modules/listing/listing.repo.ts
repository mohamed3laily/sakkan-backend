import { Injectable } from '@nestjs/common';
import { CreateListingDto } from './dto/create-listing.dto';
import { DrizzleService } from '../db/drizzle.service';
import { listings } from '../db/schemas/listing/listing';

@Injectable()
export class ListingsRepository {
  constructor(private readonly drizzleService: DrizzleService) {}
  async create(userId: number, dto: CreateListingDto) {
    const [listing] = await this.drizzleService.db
      .insert(listings)
      .values({
        userId,
        dealType: dto.dealType,
        listingType: dto.listingType,
        propertyType: dto.propertyType,
        cityId: dto.cityId,
        areaId: dto.areaId,
        budgetType: dto.budgetType,
        price: dto.price,
        spaceSqm: dto.spaceSqm,
        paymentMethod: dto.paymentMethod,
        description: dto.description,
        contactWhatsapp: dto.contactWhatsapp,
        contactPhone: dto.contactPhone,
      })
      .returning();

    return listing;
  }
}
