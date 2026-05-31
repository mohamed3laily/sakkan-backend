import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { adminTypeEnum } from 'src/modules/db/schemas/admins/enums';

export class UpdateAdminDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  phone?: string;

  @IsOptional()
  @IsIn(adminTypeEnum.enumValues)
  type?: (typeof adminTypeEnum.enumValues)[number];
}
