import { IsEnum, IsOptional } from 'class-validator';

import { PaginationDto } from 'src/common/dto/pagination.dto';
import { reportStatusEnum } from 'src/modules/db/schemas/reports/enums';

type ReportStatus = (typeof reportStatusEnum.enumValues)[number];

export class AdminReportQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(reportStatusEnum.enumValues)
  status?: ReportStatus;
}
