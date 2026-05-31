import { IsNumber, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateAreaDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  nameEn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  nameAr?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  latitude?: number | null;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  longitude?: number | null;

  @IsOptional()
  @IsObject()
  geometry?: Record<string, unknown> | null;
}
