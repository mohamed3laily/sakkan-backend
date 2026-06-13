import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateDeveloperDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nameEn: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nameAr: string;
}
