import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class RequestResetDto {
  @IsString()
  @IsNotEmpty()
  phone: string;
}

export class VerifyResetDto {
  @IsString()
  phone: string;

  @IsString()
  token: string;
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  newPassword: string;
}
