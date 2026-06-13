import { IsArray, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class UpdateProjectDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  developerId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cityId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  areaId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  nameEn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  nameAr?: string;

  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @IsOptional()
  @IsString()
  descriptionAr?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  addressEn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  addressAr?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  priceStartingFrom?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  commissionPercentage?: number;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  whatsappPhone?: string;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (value == null || value === '') return undefined;
    return Array.isArray(value) ? value : [value];
  })
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  removeAttachmentIds?: number[];
}
