import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  ValidateIf,
  IsBoolean,
} from 'class-validator';
import {
  DealType,
  ListingType,
  PropertyType,
  BudgetType,
  PaymentMethod,
} from '../enum/listing.enums';

export class CreateListingDto {
  @IsString()
  @MaxLength(255)
  title: string;

  @IsEnum(DealType)
  dealType: DealType;

  @IsEnum(ListingType)
  listingType: ListingType;

  @IsEnum(PropertyType)
  propertyType: PropertyType;

  @IsInt()
  @IsPositive()
  cityId: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  areaId?: number;

  @IsEnum(BudgetType)
  budgetType: BudgetType;

  @ValidateIf((o) => o.budgetType === BudgetType.FIXED)
  @IsInt()
  @IsPositive()
  price?: number;

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
}
