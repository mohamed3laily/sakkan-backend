import { Type } from 'class-transformer';
import { IsIn, IsInt, ValidateIf } from 'class-validator';

import { notifiableTypeEnum } from '../../db/schemas/notifications/notifications';

function recipientTypesNeedUserId(type: string): boolean {
  return (
    type === 'TODO_REMINDER' ||
    type === 'SUBSCRIPTION_GOING_TO_EXPIRE' ||
    type === 'LISTING_REQUEST_RECEIVED'
  );
}

export class TestNotificationDto {
  @IsIn(notifiableTypeEnum.enumValues)
  type: (typeof notifiableTypeEnum.enumValues)[number];

  @ValidateIf((o: TestNotificationDto) => recipientTypesNeedUserId(o.type))
  @IsInt()
  @Type(() => Number)
  userId?: number;
}
