import { IsEnum, IsInt, IsPositive, IsOptional, IsString, MaxLength } from 'class-validator';
import { reportableTypeEnum, reportReasonEnum } from 'src/modules/db/schemas/reports/enums';

export type ReportableType = (typeof reportableTypeEnum.enumValues)[number];
export const ReportableTypeEnum = Object.fromEntries(
  reportableTypeEnum.enumValues.map((v) => [v, v]),
);

export type ReportReason = (typeof reportReasonEnum.enumValues)[number];
export const ReportReasonEnum = Object.fromEntries(reportReasonEnum.enumValues.map((v) => [v, v]));

export class CreateReportDto {
  @IsEnum(ReportableTypeEnum)
  reportableType: ReportableType;

  @IsInt()
  @IsPositive()
  reportableId: number;

  @IsEnum(ReportReasonEnum)
  reason: ReportReason;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
