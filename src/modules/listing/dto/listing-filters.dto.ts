import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

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
  @Type(() => Number)
  cityId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
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
  @Type(() => Boolean)
  @IsBoolean()
  isSerious?: boolean;

  @IsOptional()
  @IsString()
  keyword?: string;
}
