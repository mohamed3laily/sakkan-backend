import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class SubscribeDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  planId!: number;

  @IsOptional()
  @IsString()
  @IsIn(['card', 'wallet'])
  paymentMethod?: 'card' | 'wallet';
}
