import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { NotifiableType } from '../../db/schemas/notifications/notifications';
import type { TestNotificationDto } from '../dto/test-notification.dto';
import { NotificationQueue } from '../jobs/notification.queue';
import type { NotificationJobPayload } from '../jobs/notification.jobs';
import { NotificationRepository } from '../repositories/notification.repository';

function isSingleRecipientType(type: NotifiableType): boolean {
  return (
    type === 'TODO_REMINDER' ||
    type === 'SUBSCRIPTION_GOING_TO_EXPIRE' ||
    type === 'LISTING_REQUEST_RECEIVED'
  );
}

@Injectable()
export class NotificationTestService {
  constructor(
    private readonly config: ConfigService,
    private readonly repo: NotificationRepository,
    private readonly notificationQueue: NotificationQueue,
  ) {}

  async sendTestNotification(dto: TestNotificationDto): Promise<void> {

    if (isSingleRecipientType(dto.type)) {
      if (dto.userId == null) {
        throw new BadRequestException('VALIDATION_ERROR');
      }
      const user = await this.repo.findUserPushTarget(dto.userId);
      if (!user) {
        throw new NotFoundException('USER_NOT_FOUND');
      }
    }

    const payload = await this.buildPayloadFromFixtures(dto);
    await this.notificationQueue.dispatch(payload);
  }

  private async buildPayloadFromFixtures(dto: TestNotificationDto): Promise<NotificationJobPayload> {
    switch (dto.type) {
      case 'LISTING_PREFERENCE_MATCH': {
        const fixture = await this.repo.findFixturePreferenceMatch();
        if (!fixture) {
          throw new NotFoundException('NOTIFICATION_TEST_NO_FIXTURE');
        }
        return { type: 'LISTING_PREFERENCE_MATCH', ...fixture };
      }
      case 'SERIOUS_LISTING_CREATED': {
        const fixture = await this.repo.findFixtureSeriousListing();
        if (!fixture) {
          throw new NotFoundException('NOTIFICATION_TEST_NO_FIXTURE');
        }
        return { type: 'SERIOUS_LISTING_CREATED', ...fixture };
      }
      case 'TODO_REMINDER': {
        const uid = dto.userId as number;
        const todo = await this.repo.findFixtureTodoForUser(uid);
        return {
          type: 'TODO_REMINDER',
          userId: uid,
          todoId: todo?.id ?? 0,
          todoTitle: todo?.title ?? 'Test task',
        };
      }
      case 'SUBSCRIPTION_GOING_TO_EXPIRE': {
        const uid = dto.userId as number;
        const fixture = await this.repo.findFixtureSubscriptionForUser(uid);
        if (!fixture) {
          throw new NotFoundException('NOTIFICATION_TEST_NO_FIXTURE');
        }
        return {
          type: 'SUBSCRIPTION_GOING_TO_EXPIRE',
          userId: uid,
          ...fixture,
        };
      }
      case 'LISTING_REQUEST_RECEIVED': {
        const uid = dto.userId as number;
        const fixture = await this.repo.findFixtureListingRequestForAgent(uid);
        if (!fixture) {
          throw new NotFoundException('NOTIFICATION_TEST_NO_FIXTURE');
        }
        return {
          type: 'LISTING_REQUEST_RECEIVED',
          agentId: uid,
          listingId: fixture.listingId,
          requesterUserId: fixture.requesterUserId,
        };
      }
    }
  }
}
