import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateCityDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nameEn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nameAr?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  latitude?: number | null;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  longitude?: number | null;
}
