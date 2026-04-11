import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  IsBoolean,
  IsArray,
  ArrayMaxSize,
  ValidateIf,
  IsNumber,
} from 'class-validator';
import { DealType, ListingType, BudgetType, PaymentMethod } from '../enum/listing.enums';
import { Type } from 'class-transformer';

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
  @IsInt({ each: true })
  @ValidateIf((o) => o.listingType === ListingType.OFFER)
  @ArrayMaxSize(1)
  areaIds?: number[];

  @IsEnum(BudgetType)
  budgetType: BudgetType;

  @IsInt()
  @IsPositive()
  @IsOptional()
  price?: number;

  @IsInt()
  @IsPositive()
  @IsOptional()
  mPrice?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  spaceSqm?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  numberOfRooms?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  numberOfBathrooms?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  propertyAge?: number;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsBoolean()
  isSerious?: boolean;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsBoolean()
  contactWhatsapp?: boolean = true;

  @IsOptional()
  @IsBoolean()
  contactPhone?: boolean = false;

  @IsOptional()
  @IsInt()
  agentId?: number;
}
