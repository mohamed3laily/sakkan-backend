import { IsEnum } from 'class-validator';
import { listingStatusEnum } from 'src/modules/db/schemas/listing/enums';

type ListingStatus = (typeof listingStatusEnum.enumValues)[number];

export class UpdateListingStatusDto {
  @IsEnum(listingStatusEnum.enumValues)
  status: ListingStatus;
}
