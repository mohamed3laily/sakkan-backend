import { IsEnum } from 'class-validator';

import { reportStatusEnum } from 'src/modules/db/schemas/reports/enums';

type ReportStatus = (typeof reportStatusEnum.enumValues)[number];

export class UpdateReportStatusDto {
  @IsEnum(reportStatusEnum.enumValues)
  status: ReportStatus;
}
