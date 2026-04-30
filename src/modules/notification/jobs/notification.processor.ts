import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

import { NOTIFICATION_JOBS, QUEUES } from 'src/common/queues/queue.constants';
import type {
  InsertNotification,
  NotifiableType,
} from '../../db/schemas/notifications/notifications';

import { FcmService } from '../fcm/fcm.service';
import { buildMessage, type NotificationLanguage } from '../messages/notification.messages';
import {
  NotificationRepository,
  type PushTargetUser,
} from '../repositories/notification.repository';
import { type NotificationJobPayload } from './notification.jobs';

@Processor(QUEUES.NOTIFICATION)
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private readonly repo: NotificationRepository,
    private readonly fcm: FcmService,
  ) {
    super();
  }

  async process(job: Job<NotificationJobPayload>): Promise<void> {
    switch (job.name) {
      case NOTIFICATION_JOBS.DISPATCH:
        return this.dispatch(job.data);
      default:
        this.logger.warn(`Unknown job: ${job.name}`);
    }
  }

  private async dispatch(data: NotificationJobPayload): Promise<void> {
    switch (data.type) {
      case 'LISTING_PREFERENCE_MATCH':
        return this.handlePreferenceMatch(data);
      case 'SERIOUS_LISTING_CREATED':
        return this.handleSeriousListing(data);
      case 'LISTING_REQUEST_RECEIVED':
        return this.handleListingRequest(data);
    }
  }

  private async handlePreferenceMatch(
    data: Extract<NotificationJobPayload, { type: 'LISTING_PREFERENCE_MATCH' }>,
  ): Promise<void> {
    const targetUsers = await this.repo.findUsersMatchingPreferences(
      data.areaIds,
      data.propertyTypeId,
    );
    if (!targetUsers.length) {
      return;
    }

    const templateData = { cityName: data.cityName };
    await this.dispatchToUsers(targetUsers, 'LISTING_PREFERENCE_MATCH', templateData, {
      listingId: String(data.listingId),
      notifiableType: 'LISTING',
    });
  }

  private async handleSeriousListing(
    data: Extract<NotificationJobPayload, { type: 'SERIOUS_LISTING_CREATED' }>,
  ): Promise<void> {
    const targetUsers = await this.repo.findNonSeekers();
    if (!targetUsers.length) {
      return;
    }

    const templateData = { cityName: data.cityName, listingType: data.listingType };
    await this.dispatchToUsers(targetUsers, 'SERIOUS_LISTING_CREATED', templateData, {
      listingId: String(data.listingId),
      notifiableType: 'LISTING',
    });
  }

  private async handleListingRequest(
    data: Extract<NotificationJobPayload, { type: 'LISTING_REQUEST_RECEIVED' }>,
  ): Promise<void> {
    const agent = await this.repo.findUserPushTarget(data.agentId);
    if (!agent) {
      return;
    }

    const requesterName =
      (await this.repo.findRequesterDisplayName(data.requesterUserId)) || 'User';
    const templateData = { requesterName };
    await this.dispatchToUsers([agent], 'LISTING_REQUEST_RECEIVED', templateData, {
      listingId: String(data.listingId),
      notifiableType: 'LISTING',
    });
  }

  private async dispatchToUsers(
    targetUsers: PushTargetUser[],
    type: NotifiableType,
    templateData: Record<string, string>,
    fcmData?: Record<string, string>,
  ): Promise<void> {
    const rows: InsertNotification[] = targetUsers.map((u) => {
      const ar = buildMessage(type, 'ar', templateData);
      const en = buildMessage(type, 'en', templateData);
      return {
        userId: u.id,
        type,
        titleAr: ar.title,
        titleEn: en.title,
        bodyAr: ar.body,
        bodyEn: en.body,
        notifiableId: fcmData?.listingId ? Number(fcmData.listingId) : null,
        notifiableType: fcmData?.notifiableType ?? null,
      };
    });

    await this.repo.insertMany(rows);

    const pushGroups = new Map<string, string[]>();
    for (const u of targetUsers) {
      if (!u.fcmToken) {
        continue;
      }
      const lang = (u.language === 'EN' ? 'en' : 'ar') as NotificationLanguage;
      if (!pushGroups.has(lang)) {
        pushGroups.set(lang, []);
      }
      pushGroups.get(lang)!.push(u.fcmToken);
    }

    for (const [lang, tokens] of pushGroups) {
      const { title, body } = buildMessage(type, lang as NotificationLanguage, templateData);
      await this.fcm.sendToMultipleTokens(tokens, title, body, fcmData);
    }
  }
}
