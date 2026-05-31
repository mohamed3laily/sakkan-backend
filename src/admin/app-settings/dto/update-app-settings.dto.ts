import { ArrayNotEmpty, IsArray, IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateAppSettingsDto {
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @MaxLength(32, { each: true })
  phones?: string[];

  @IsOptional()
  @IsString()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  termsAndConditionsEn?: string;

  @IsOptional()
  @IsString()
  termsAndConditionsAr?: string;

  @IsOptional()
  @IsString()
  privacyPolicyEn?: string;

  @IsOptional()
  @IsString()
  privacyPolicyAr?: string;
}
