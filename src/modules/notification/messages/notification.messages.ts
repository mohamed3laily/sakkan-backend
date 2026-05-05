import { NotifiableType } from '../../db/schemas/notifications/notifications';

export type NotificationLanguage = 'ar' | 'en';

interface NotificationContent {
  title: string;
  body: string;
}

type MessageFactory<TData> = (data: TData) => NotificationContent;

interface BilingualMessage<TData> {
  ar: MessageFactory<TData>;
  en: MessageFactory<TData>;
}

export const NOTIFICATION_MESSAGES: Record<
  NotifiableType,
  BilingualMessage<Record<string, string>>
> = {
  LISTING_PREFERENCE_MATCH: {
    ar: (d) => ({
      title: 'طلب جديد قد يهمك',
      body: `تم نشر طلب جديد قد يهمك بناء على اهتماماتك`,
    }),
    en: (d) => ({
      title: 'New listing matches your preferences',
      body: `A new listing might match your preferences.`,
    }),
  },

  SERIOUS_LISTING_CREATED: {
    ar: (d) => ({
      title: 'طلب جاد قد يهمك',
      body: `نشر طلب جاد قد يهمكو تواصل مع الطالب الأن`,
    }),
    en: (d) => ({
      title: 'New serious request',
      body: `A new serious request was posted and you might want to contact the requester.`,
    }),
  },

  LISTING_REQUEST_RECEIVED: {
    ar: (d) => ({
      title: 'طلب إعلان جديد',
      body: `قام ${d.requesterName} بإنشاء طلب إعلان وطلب مساعدتك.`,
    }),
    en: (d) => ({
      title: 'New listing request',
      body: `${d.requesterName} created a listing request and asked for your help.`,
    }),
  },

  TODO_REMINDER: {
    ar: (d) => ({
      title: 'تذكير بمهمة',
      body: `موعد المهمة "${d.todoTitle}" بعد ساعتين.`,
    }),
    en: (d) => ({
      title: 'Task reminder',
      body: `Your task "${d.todoTitle}" is due in 2 hours.`,
    }),
  },

  SUBSCRIPTION_GOING_TO_EXPIRE: {
    ar: (d) => ({
      title: 'اشتراكك ينتهي قريباً',
      body: `تنتهي صلاحية اشتراكك «${d.planNameAr}» خلال 3 أيام. جدّد من التطبيق للاستمرار.`,
    }),
    en: (d) => ({
      title: 'Subscription ending soon',
      body: `Your "${d.planNameEn}" subscription ends in 3 days. Renew in the app to keep access.`,
    }),
  },
};

export function buildMessage(
  type: NotifiableType,
  lang: NotificationLanguage,
  data: Record<string, string>,
): NotificationContent {
  return NOTIFICATION_MESSAGES[type][lang](data);
}
