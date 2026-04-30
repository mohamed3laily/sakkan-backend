import { Injectable } from '@nestjs/common';

import { AttachmentService } from '../attachment/attachment.service';
import { CityQueue } from '../city/city.queue';

import { CreateListingDto } from './dto/create-listing.dto';
import { ListingCreatedNotificationService } from './listing-created-notification.service';

@Injectable()
export class ListingPostCreateService {
  constructor(
    private readonly attachmentService: AttachmentService,
    private readonly cityQueue: CityQueue,
    private readonly listingCreatedNotifications: ListingCreatedNotificationService,
  ) {}

  async run(params: {
    listingId: number;
    dto: CreateListingDto;
    creatorUserId: number;
    images: Express.Multer.File[];
  }): Promise<void> {
    const { listingId, dto, creatorUserId, images } = params;

    await Promise.all([
      images.length > 0
        ? this.attachmentService.createMany('LISTING', listingId, images)
        : Promise.resolve(),
      this.cityQueue.incrementListingCount(dto.cityId),
      this.listingCreatedNotifications.enqueueForNewListing({
        listingId,
        dto,
        creatorUserId,
      }),
    ]);
  }
}
