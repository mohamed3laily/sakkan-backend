import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyApplePurchaseDto {
  @IsString()
  @IsNotEmpty()
  transactionId!: string;

  @IsString()
  @IsNotEmpty()
  productId!: string;
}
