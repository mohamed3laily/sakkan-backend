import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateSubscriptionPlanDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayNameEn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayNameAr?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  priceEgp?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  deviceLimit?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  seriousRequestViewsQuotaPerMonth?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  featuredAdQuotaPerMonth?: number;

  @IsOptional()
  @IsBoolean()
  hasPriorityListing?: boolean;

  @IsOptional()
  @IsBoolean()
  hasVerifiedBadge?: boolean;

  @IsOptional()
  @IsBoolean()
  hasDedicatedSupport?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  sortOrder?: number;
}
