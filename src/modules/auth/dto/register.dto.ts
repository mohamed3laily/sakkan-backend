import { IsIn, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';
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
}
