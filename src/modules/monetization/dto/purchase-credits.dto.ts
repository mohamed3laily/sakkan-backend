import { IsNotEmpty, IsString } from 'class-validator';

export class PurchaseCreditsDto {
  @IsString()
  @IsNotEmpty()
  productKey!: string;
}
