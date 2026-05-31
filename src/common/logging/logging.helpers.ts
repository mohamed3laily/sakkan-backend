/** Shared action names for structured logs — filter in prod with e.g. action=user_login */
export const LogAction = {
  USER_REGISTER: 'user_register',
  USER_LOGIN: 'user_login',
  USER_VERIFY_PHONE: 'verify_phone',
  USER_RESEND_VERIFY_PHONE: 'resend_verify_phone',
  USER_PASSWORD_RESET_REQUEST: 'password_reset_request',
  USER_PASSWORD_RESET_COMPLETE: 'password_reset_complete',
  USER_TOKEN_REFRESH: 'user_token_refresh',
  USER_LOGOUT: 'user_logout',

  ADMIN_REGISTER: 'admin_register',
  ADMIN_LOGIN: 'admin_login',
  ADMIN_TOKEN_REFRESH: 'admin_token_refresh',
  ADMIN_LOGOUT: 'admin_logout',

  PREMIUM_LISTING_CREATED: 'premium_listing_created',
  PREMIUM_LISTINGS_EXPIRED: 'premium_listings_expired',
  USER_LISTING_DELETED: 'user_listing_deleted',

  ADMIN_LISTING_STATUS_UPDATED: 'admin_listing_status_updated',
  ADMIN_LISTING_DELETED: 'admin_listing_deleted',
  ADMIN_USER_DEACTIVATED: 'admin_user_deactivated',
  ADMIN_USER_DELETED: 'admin_user_deleted',
  ADMIN_CITY_CREATED: 'admin_city_created',
  ADMIN_CITY_UPDATED: 'admin_city_updated',
  ADMIN_CITY_DELETED: 'admin_city_deleted',
  ADMIN_AREA_CREATED: 'admin_area_created',
  ADMIN_AREA_UPDATED: 'admin_area_updated',
  ADMIN_AREA_DELETED: 'admin_area_deleted',
  ADMIN_PLAN_UPDATED: 'admin_plan_updated',
  ADMIN_SUBSCRIPTION_CANCELLED: 'admin_subscription_cancelled',
  ADMIN_APP_SETTINGS_UPDATED: 'admin_app_settings_updated',

  USER_PROFILE_UPDATED: 'user_profile_updated',
  USER_PHONE_CHANGED: 'user_phone_changed',
  USER_PROFILE_PICTURE_UPDATED: 'user_profile_picture_updated',
  USER_ACCOUNT_DELETED: 'user_account_deleted',

  REPORT_CREATED: 'report_created',
  REPORT_DUPLICATE_REJECTED: 'report_duplicate_rejected',

  PAYMOB_CHECKOUT_CREATED: 'paymob_checkout_created',
  PAYMOB_CHECKOUT_FAILED: 'paymob_checkout_failed',
  PAYMOB_WEBHOOK_RECEIVED: 'paymob_webhook_received',
  PAYMOB_RETURN_RECEIVED: 'paymob_return_received',
  PAYMOB_HMAC_INVALID: 'paymob_hmac_invalid',
  SUBSCRIPTION_ACTIVATED: 'subscription_activated',
  CREDITS_ADDED: 'credits_added',
  FEATURED_BUNDLE_ACTIVATED: 'featured_bundle_activated',

  SMS_SENT: 'sms_sent',
  SMS_SEND_FAILED: 'sms_send_failed',
  FCM_SEND_FAILED: 'fcm_send_failed',
  FCM_MULTICAST_RESULT: 'fcm_multicast_result',

  S3_DELETE_FAILED: 's3_delete_failed',
  ORPHAN_ATTACHMENT_CLEANUP: 'orphan_attachment_cleanup',
  BULLMQ_JOB_FAILED: 'bullmq_job_failed',
} as const;

export function maskPhone(phone: string): string {
  const trimmed = phone.trim();
  if (trimmed.length <= 4) return '****';
  const visible = trimmed.slice(-4);
  const prefix = trimmed.startsWith('+') ? '+' : '';
  return `${prefix}***${visible}`;
}
