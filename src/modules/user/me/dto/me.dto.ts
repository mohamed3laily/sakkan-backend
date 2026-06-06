import { SocialMediaLinks } from 'src/modules/db/schemas/user/user';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsObject,
  IsIn,
  MaxLength,
  IsInt,
  IsBoolean,
} from 'class-validator';
import {
  userLanguageEnum,
  userTypeEnum,
  type UserLanguage,
} from 'src/modules/db/schemas/user/enums';

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsIn(userTypeEnum.enumValues)
  type?: (typeof userTypeEnum.enumValues)[number];

  @IsOptional()
  @IsString()
  organizationNameAr?: string;

  @IsOptional()
  @IsString()
  organizationNameEn?: string;

  @IsOptional()
  @IsObject()
  socialMediaLinks?: SocialMediaLinks;

  @IsOptional()
  @IsInt()
  cityId?: number;

  @IsOptional()
  @IsBoolean()
  contactViaWhatsapp?: boolean;

  @IsOptional()
  @IsBoolean()
  contactViaPhone?: boolean;

  @IsOptional()
  @IsIn(userLanguageEnum.enumValues)
  language?: UserLanguage;
}

export class ChangePhoneDto {
  @IsString()
  @IsNotEmpty()
  phone: string;
}
