import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateDeveloperDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  nameEn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  nameAr?: string;
}
