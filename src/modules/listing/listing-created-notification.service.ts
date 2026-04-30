import { Injectable } from '@nestjs/common';

import { CityService } from '../city/city.service';
import { NotificationQueue } from '../notification/jobs/notification.queue';

import { CreateListingDto } from './dto/create-listing.dto';
import { ListingType } from './enum/listing.enums';

@Injectable()
export class ListingCreatedNotificationService {
  constructor(
    private readonly notificationQueue: NotificationQueue,
    private readonly cityService: CityService,
  ) {}

  async enqueueForNewListing(params: {
    listingId: number;
    dto: CreateListingDto;
    creatorUserId: number;
  }): Promise<void> {
    const { listingId, dto, creatorUserId } = params;
    const cityName = await this.resolveCityName(dto.cityId);

    const dispatches: Promise<void>[] = [];
    const isRequestListing = dto.listingType === ListingType.REQUEST;

    if (isRequestListing) {
      if (dto.makePremium === true) {
        dispatches.push(
          this.notificationQueue.dispatch({
            type: 'SERIOUS_LISTING_CREATED',
            listingId,
            cityName,
            listingType: dto.listingType,
          }),
        );
      }

      if (dto.areaIds?.length) {
        dispatches.push(
          this.notificationQueue.dispatch({
            type: 'LISTING_PREFERENCE_MATCH',
            listingId,
            cityId: dto.cityId,
            cityName,
            areaIds: dto.areaIds,
            propertyTypeId: dto.propertyTypeId,
          }),
        );
      }
    }

    if (dto.agentId) {
      dispatches.push(
        this.notificationQueue.dispatch({
          type: 'LISTING_REQUEST_RECEIVED',
          listingId,
          agentId: dto.agentId,
          requesterUserId: creatorUserId,
        }),
      );
    }

    await Promise.all(dispatches);
  }

  private async resolveCityName(cityId: number): Promise<string> {
    const city = await this.cityService.findCityById(cityId);
    return city?.nameEn ?? String(cityId);
  }
}
