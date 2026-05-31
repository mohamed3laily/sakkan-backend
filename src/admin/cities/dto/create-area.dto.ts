import { IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAreaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nameEn: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nameAr: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  longitude?: number;

  @IsOptional()
  @IsObject()
  geometry?: Record<string, unknown>;
}
