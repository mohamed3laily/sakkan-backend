import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';

export type PurchaseCreditsProduct = 'serious_single' | 'featured_single' | 'featured_bundle';

export class PurchaseCreditsDto {
  @IsIn(['serious_single', 'featured_single', 'featured_bundle'])
  product!: PurchaseCreditsProduct;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  listingId?: number;
}
