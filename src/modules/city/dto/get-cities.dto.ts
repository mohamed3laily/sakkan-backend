import { IsOptional, IsString } from 'class-validator';

export class GetCitiesDto {
  @IsOptional()
  @IsString()
  name?: string;
}
