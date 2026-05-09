import type { SelectNotification } from '../../db/schemas/notifications/notifications';

export type PushTargetUser = {
  id: number;
  fcmToken: string | null;
  language: string;
};

export type TodoReminderRow = {
  id: number;
  title: string;
  userId: number;
  fcmToken: string | null;
  language: string;
};

export type SubscriptionExpiryReminderRow = {
  userSubscriptionId: number;
  userId: number;
  planNameEn: string;
  planNameAr: string;
};

export type NotificationListItem = SelectNotification & { isFavorited: boolean };
