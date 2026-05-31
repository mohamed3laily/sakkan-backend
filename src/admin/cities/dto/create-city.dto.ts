import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCityDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nameEn: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nameAr: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  longitude?: number;
}
