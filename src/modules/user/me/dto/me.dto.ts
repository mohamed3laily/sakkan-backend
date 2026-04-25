import { SocialMediaLinks } from 'src/modules/db/schemas/user/user';
import { IsNotEmpty, IsOptional, IsString, IsObject, IsIn } from 'class-validator';
import { userTypeEnum } from 'src/modules/db/schemas/user/enums';

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
  profilePicture: string;
}

export class ChangePhoneDto {
  @IsString()
  @IsNotEmpty()
  phone: string;
}

export type MeRepositoryUpdate = Partial<UpdateMeDto> & {
  phone?: string;
};
