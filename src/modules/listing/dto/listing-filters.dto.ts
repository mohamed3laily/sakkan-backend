import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Transform } from 'class-transformer';

import {
  BudgetType,
  DealType,
  ListingType,
  PaymentMethod,
  PropertyType,
} from '../enum/listing.enums';

export class ListingFiltersDto {
  @IsOptional()
  @IsEnum(DealType)
  dealType?: DealType;

  @IsOptional()
  @IsEnum(ListingType)
  listingType?: ListingType;

  @IsOptional()
  @IsEnum(PropertyType)
  propertyType?: PropertyType;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => parseInt(value, 10), { toClassOnly: true })
  cityId?: number;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => parseInt(value, 10), { toClassOnly: true })
  areaId?: number;

  @IsOptional()
  @IsEnum(BudgetType)
  budgetType?: BudgetType;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsInt()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsInt()
  minSpaceSqm?: number;

  @IsOptional()
  @IsInt()
  maxSpaceSqm?: number;

  @IsOptional()
  @IsInt()
  numberOfRooms?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  numberOfBathrooms?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  isSerious?: boolean;

  @IsOptional()
  @IsString()
  keyword?: string;
}
