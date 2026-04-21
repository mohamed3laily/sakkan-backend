import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  BudgetType,
  DealType,
  ListingType,
  PaymentMethod,
} from 'src/modules/listing/enum/listing.enums';
import { ListingTier } from 'src/modules/listing/dto/listing-filters.dto';

export class ListingFiltersDto {
  @IsOptional()
  @IsEnum(DealType)
  dealType?: DealType;

  @IsOptional()
  @IsEnum(ListingType)
  listingType?: ListingType;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  propertyTypeId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  cityId?: number;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @Type(() => Number)
  areaIds?: number[];

  @IsOptional()
  @IsEnum(BudgetType)
  budgetType?: BudgetType;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  minPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  maxPrice?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  minSpaceSqm?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  maxSpaceSqm?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  numberOfRooms?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  numberOfBathrooms?: number;

  @IsOptional()
  @IsEnum(ListingTier)
  listingTier?: ListingTier;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  favorited?: boolean;
}
