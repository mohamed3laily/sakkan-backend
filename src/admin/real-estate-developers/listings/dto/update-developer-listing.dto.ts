import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

import { paymentMethodEnum } from 'src/modules/db/schemas/listing/enums';

type PaymentMethod = (typeof paymentMethodEnum.enumValues)[number];

export class UpdateDeveloperListingDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  projectId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  propertyTypeId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  spaceSqm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  numberOfRooms?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  numberOfBathrooms?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  numberOfUnits?: number;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => (Array.isArray(value) ? value : value ? [value] : undefined))
  @IsEnum(paymentMethodEnum.enumValues, { each: true })
  developerPaymentMethods?: PaymentMethod[];

  @IsOptional()
  @IsDateString()
  deliveryDate?: string;
}
