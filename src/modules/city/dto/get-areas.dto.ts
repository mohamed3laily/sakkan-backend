import { IsOptional, IsString } from 'class-validator';

export class GetAreasDto {
  @IsOptional()
  @IsString()
  name?: string;
}
