import type { SelectNotification } from '../../db/schemas/notifications/notifications';

export type PushTargetUser = {
  id: number;
  language: string;
  fcmTokens: string[];
};

export type TodoReminderRow = {
  id: number;
  title: string;
  userId: number;
};

export type SubscriptionExpiryReminderRow = {
  userSubscriptionId: number;
  userId: number;
  planNameEn: string;
  planNameAr: string;
};

export type NotificationListItem = SelectNotification & { isFavorited: boolean };
