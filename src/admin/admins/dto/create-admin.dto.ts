import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { adminTypeEnum } from 'src/modules/db/schemas/admins/enums';

export class CreateAdminDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsOptional()
  @IsIn(adminTypeEnum.enumValues)
  type?: (typeof adminTypeEnum.enumValues)[number];
}
