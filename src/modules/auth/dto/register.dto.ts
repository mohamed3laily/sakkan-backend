import { IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { userTypeEnum } from 'src/modules/db/schemas/schema-index';
export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsNotEmpty()
  @IsIn(userTypeEnum.enumValues)
  type?: (typeof userTypeEnum.enumValues)[number];

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsUUID()
  installationId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  deviceLabel?: string;
}
