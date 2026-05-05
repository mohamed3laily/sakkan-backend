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

import type { FcmPayload, NotifiableMeta } from '../types/notification.types';

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

  // ── Router ───────────────────────────────────────────────────────────────

  private async dispatch(data: NotificationJobPayload): Promise<void> {
    switch (data.type) {
      case 'LISTING_PREFERENCE_MATCH':
        return this.handlePreferenceMatch(data);
      case 'SERIOUS_LISTING_CREATED':
        return this.handleSeriousListing(data);
      case 'LISTING_REQUEST_RECEIVED':
        return this.handleListingRequest(data);
      case 'TODO_REMINDER':
        return this.handleTodoReminder(data);
      case 'SUBSCRIPTION_GOING_TO_EXPIRE':
        return this.handleSubscriptionExpiring(data);
    }
  }

  // ── Handlers ─────────────────────────────────────────────────────────────

  private async handlePreferenceMatch(
    data: Extract<NotificationJobPayload, { type: 'LISTING_PREFERENCE_MATCH' }>,
  ): Promise<void> {
    const users = await this.repo.findUsersMatchingPreferences(
      data.areaIds,
      data.propertyTypeId,
    );
    if (!users.length) {
      return;
    }

    await this.notify({
      users,
      type: 'LISTING_PREFERENCE_MATCH',
      templateData: { cityName: data.cityName },
      meta: { notifiableId: data.listingId, notifiableType: 'LISTING' },
      fcmPayload: { listingId: String(data.listingId) },
    });
  }

  private async handleSeriousListing(
    data: Extract<NotificationJobPayload, { type: 'SERIOUS_LISTING_CREATED' }>,
  ): Promise<void> {
    const users = await this.repo.findNonSeekers();
    if (!users.length) {
      return;
    }

    await this.notify({
      users,
      type: 'SERIOUS_LISTING_CREATED',
      templateData: { cityName: data.cityName, listingType: data.listingType },
      meta: { notifiableId: data.listingId, notifiableType: 'LISTING' },
      fcmPayload: { listingId: String(data.listingId) },
    });
  }

  private async handleListingRequest(
    data: Extract<NotificationJobPayload, { type: 'LISTING_REQUEST_RECEIVED' }>,
  ): Promise<void> {
    const [agent, requesterName] = await Promise.all([
      this.repo.findUserPushTarget(data.agentId),
      this.repo.findRequesterDisplayName(data.requesterUserId),
    ]);
    if (!agent) {
      return;
    }

    await this.notify({
      users: [agent],
      type: 'LISTING_REQUEST_RECEIVED',
      templateData: { requesterName: requesterName || 'User' },
      meta: { notifiableId: data.listingId, notifiableType: 'LISTING' },
      fcmPayload: { listingId: String(data.listingId) },
    });
  }

  private async handleTodoReminder(
    data: Extract<NotificationJobPayload, { type: 'TODO_REMINDER' }>,
  ): Promise<void> {
    const user = await this.repo.findUserPushTarget(data.userId);
    if (!user) {
      return;
    }

    await this.notify({
      users: [user],
      type: 'TODO_REMINDER',
      templateData: { todoTitle: data.todoTitle },
      meta: { notifiableId: data.todoId, notifiableType: 'TODO' },
      fcmPayload: { todoId: String(data.todoId) },
    });
  }

  private async handleSubscriptionExpiring(
    data: Extract<NotificationJobPayload, { type: 'SUBSCRIPTION_GOING_TO_EXPIRE' }>,
  ): Promise<void> {
    const user = await this.repo.findUserPushTarget(data.userId);
    if (!user) {
      return;
    }

    await this.notify({
      users: [user],
      type: 'SUBSCRIPTION_GOING_TO_EXPIRE',
      templateData: { planNameEn: data.planNameEn, planNameAr: data.planNameAr },
      meta: {
        notifiableId: data.userSubscriptionId,
        notifiableType: 'USER_SUBSCRIPTION',
      },
      fcmPayload: { userSubscriptionId: String(data.userSubscriptionId) },
    });
  }

  // ── Core dispatch ─────────────────────────────────────────────────────────

  private async notify(params: {
    users: PushTargetUser[];
    type: NotifiableType;
    templateData: Record<string, string>;
    meta: NotifiableMeta;
    fcmPayload?: FcmPayload;
  }): Promise<void> {
    const { users, type, templateData, meta, fcmPayload } = params;

    await Promise.all([
      this.persistNotifications(users, type, templateData, meta),
      this.pushNotifications(users, type, templateData, fcmPayload),
    ]);
  }

  private async persistNotifications(
    users: PushTargetUser[],
    type: NotifiableType,
    templateData: Record<string, string>,
    meta: NotifiableMeta,
  ): Promise<void> {
    const ar = buildMessage(type, 'ar', templateData);
    const en = buildMessage(type, 'en', templateData);

    const rows: InsertNotification[] = users.map((u) => ({
      userId: u.id,
      type,
      titleAr: ar.title,
      titleEn: en.title,
      bodyAr: ar.body,
      bodyEn: en.body,
      notifiableId: meta.notifiableId,
      notifiableType: meta.notifiableType,
    }));

    await this.repo.insertMany(rows);
  }

  private async pushNotifications(
    users: PushTargetUser[],
    type: NotifiableType,
    templateData: Record<string, string>,
    fcmPayload?: FcmPayload,
  ): Promise<void> {
    const byLang = new Map<NotificationLanguage, string[]>();

    for (const u of users) {
      if (!u.fcmToken) {
        continue;
      }
      const lang: NotificationLanguage = u.language === 'EN' ? 'en' : 'ar';
      const tokens = byLang.get(lang) ?? [];
      tokens.push(u.fcmToken);
      byLang.set(lang, tokens);
    }

    await Promise.all(
      [...byLang.entries()].map(([lang, tokens]) => {
        const { title, body } = buildMessage(type, lang, templateData);
        return this.fcm.sendToMultipleTokens(tokens, title, body, fcmPayload);
      }),
    );
  }
}
