import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  IsBoolean,
  IsArray,
  IsNumber,
} from 'class-validator';
import { DealType, ListingType, BudgetType, PaymentMethod } from '../enum/listing.enums';
import { Transform, Type } from 'class-transformer';

export class CreateListingDto {
  @IsString()
  @MaxLength(255)
  title: string;

  @IsEnum(DealType)
  dealType: DealType;

  @IsEnum(ListingType)
  listingType: ListingType;

  @IsInt()
  @Type(() => Number)
  propertyTypeId: number;

  @IsInt()
  @IsPositive()
  @Type(() => Number)
  cityId: number;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @Type(() => Number)
  areaIds?: number[];

  @IsEnum(BudgetType)
  budgetType: BudgetType;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  price?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  mPrice?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  spaceSqm?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  numberOfRooms?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  numberOfBathrooms?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  propertyAge?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  longitude?: number;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  contactWhatsapp?: boolean = true;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  contactPhone?: boolean = false;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  agentId?: number;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }): boolean | undefined => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === true || value === false) return value;
    return undefined;
  })
  makePremium?: boolean;
}
