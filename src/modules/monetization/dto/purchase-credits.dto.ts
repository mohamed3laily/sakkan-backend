import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class PurchaseCreditsDto {
  @IsString()
  @IsNotEmpty()
  productKey!: string;

  @IsString()
  @IsOptional()
  redirectionUrl?: string;
}
