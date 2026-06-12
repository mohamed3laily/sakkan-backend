import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class PurchaseCreditsDto {
  @IsString()
  @IsNotEmpty()
  productKey!: string;

  @IsString()
  @IsOptional()
  redirectionUrl?: string;

  @IsOptional()
  @IsString()
  @IsIn(['card', 'wallet'])
  paymentMethod?: 'card' | 'wallet';
}
