import { SocialMediaLinks } from 'src/modules/db/schemas/user/user';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsObject,
  IsIn,
  MaxLength,
  IsDate,
} from 'class-validator';
import {
  userTypeEnum,
  userLanguageEnum,
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
  @IsString()
  organizationNameAr?: string;

  @IsOptional()
  @IsString()
  organizationNameEn?: string;

  @IsOptional()
  @IsObject()
  socialMediaLinks?: SocialMediaLinks;

  @IsOptional()
  cityId?: number;

  @IsOptional()
  contactViaWhatsapp?: boolean;

  @IsOptional()
  contactViaPhone?: boolean;

  @IsOptional()
  @IsIn(userTypeEnum.enumValues)
  type?: (typeof userTypeEnum.enumValues)[number];

  @IsOptional()
  @IsIn(userLanguageEnum.enumValues)
  language?: UserLanguage;

  @IsOptional()
  @IsString()
  @MaxLength(4096)
  fcmToken?: string;

  @IsOptional()
  @IsString()
  profilePicture?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  verifiedPhoneAt?: Date | null;
}

export class ChangePhoneDto {
  @IsString()
  @IsNotEmpty()
  phone: string;
}
