import { IsString, Length } from 'class-validator';

export class VerifyPhoneDto {
  @IsString()
  @Length(5, 5)
  token: string;
}

export class ResendVerifyPhoneDto {
  @IsString()
  phone: string;
}
