import { IsString, IsNumber, IsOptional, IsIn, Min, Max } from 'class-validator';
import { ReviewServiceType } from 'src/modules/db/schemas/reviews/enums';

export class CreateReviewDto {
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsIn(['PROPERTY_REQUEST_SERVICE', 'PROPERTY_LISTING_SERVICE', 'PROPERTY_MARKETING_SERVICE'])
  serviceType: ReviewServiceType;

  @IsOptional()
  @IsString()
  comment?: string;
}
