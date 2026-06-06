# Background jobs (Sakkan backend)

BullMQ queues and cron schedulers. Queue constants: [`queue.constants.ts`](../src/common/queues/queue.constants.ts).

---

## BullMQ queues

Redis connection configured in [`app.module.ts`](../src/app.module.ts) via `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`.

### `city` queue

| Job | Payload | Processor | Trigger |
| --- | ------- | --------- | ------- |
| `increment-listing-count` | `{ cityId }` | [`city.processor.ts`](../src/modules/city/city.processor.ts) | Listing create ([`city.queue.ts`](../src/modules/city/city.queue.ts)) |

Increments `cities.listing_count` asynchronously after new listing.

### `notification` queue

| Job | Payload | Processor | Trigger |
| --- | ------- | --------- | ------- |
| `dispatch-notification` | `NotificationJobPayload` | [`notification.processor.ts`](../src/modules/notification/jobs/notification.processor.ts) | [`notification.queue.ts`](../src/modules/notification/jobs/notification.queue.ts) |

Processor handles:

- Persist in-app notification row
- Send FCM push via [`fcm.service.ts`](../src/modules/notification/fcm/fcm.service.ts)
- Message templates in [`notification.messages.ts`](../src/modules/notification/messages/notification.messages.ts)

Job types include `TODO_REMINDER`, `SUBSCRIPTION_GOING_TO_EXPIRE`, and others defined in notification job types.

### `attachment` queue

| Job | Payload | Processor | Trigger |
| --- | ------- | --------- | ------- |
| `cleanup-orphans` | `{}` | [`attachment.processor.ts`](../src/modules/attachment/attachment.processor.ts) | [`attachment.queue.ts`](../src/modules/attachment/attachment.queue.ts) |

Finds orphan attachment records, deletes S3 objects, removes DB rows. Scheduled from [`user/me/listing/listing.service.ts`](../src/modules/user/me/listing/listing.service.ts) after listing operations (not a cron).

---

## Cron schedulers

Enabled via `ScheduleModule.forRoot()` in [`app.module.ts`](../src/app.module.ts).

| Schedule | Class | File | Purpose |
| -------- | ----- | ---- | ------- |
| Every 10 minutes | `SubscriptionExpiryScheduler` | [`subscription-expiry.scheduler.ts`](../src/modules/notification/jobs/subscription-expiry.scheduler.ts) | Notify users 3 days before subscription expiry |
| Every hour | `TodoReminderScheduler` | [`todo-reminder.scheduler.ts`](../src/modules/notification/jobs/todo-reminder.scheduler.ts) | Remind users of todos due in ~2 hours |
| Daily at midnight | `FcmTokenCleanupScheduler` | [`fcm-token-cleanup.scheduler.ts`](../src/modules/notification/jobs/fcm-token-cleanup.scheduler.ts) | Delete FCM tokens tied to revoked or expired sessions |
| Daily at midnight | `ListingExpiryService` | [`listing-expiry.service.ts`](../src/modules/monetization/expiry/listing-expiry.service.ts) | Downgrade expired premium listings to standard + UNLISTED |

Subscription/todo schedulers enqueue `dispatch-notification` jobs rather than sending push directly.

---

## Notification HTTP API

Controller: [`notification.controller.ts`](../src/modules/notification/controllers/notification.controller.ts)

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| POST | `/v1/notifications/test` | JWT + `NonProductionGuard` | Queue test notification |
| GET | `/v1/notifications` | JWT | List notifications |
| GET | `/v1/notifications/unread-count` | JWT | Unread count |
| PATCH | `/v1/notifications/read-all` | JWT | Mark all read |

Requires Firebase env vars for FCM delivery.

### FCM push tokens (session-bound)

FCM tokens are stored in `user_fcm_tokens`, one row per **active device session** (`user_sessions.id`). The mobile app registers after login via `PUT /v1/users/me/push-token` with `{ fcmToken }` — bound to the JWT session (`sid`).

- Push dispatch joins `user_fcm_tokens` + active sessions only (not revoked, not expired)
- A user with multiple logged-in devices receives push on **all** active device tokens
- Tokens are deleted on logout, session revoke, password change/reset, and device-limit kick
- `FcmTokenCleanupScheduler` removes any orphaned rows daily

---

## Operational notes

1. **Redis down:** BullMQ job enqueue may fail or block; city increment runs during listing create
2. **FCM failures:** logged in processor; in-app notification may still persist
3. **Non-production guards:** test endpoints (`/notifications/test`, subscription testing reset) blocked in production

---

## When modifying this area

1. New queue → add to `QUEUES` in `queue.constants.ts`, register in module via `BullModule.registerQueue`
2. New job type → add constant, handle in processor `switch`, define payload type
3. New scheduled task → create `@Injectable()` with `@Cron()`, prefer enqueueing over inline push
4. New notification type → extend job payload, message builder, and i18n under `notification.json`

---

*Update this file when queues, jobs, or schedulers change.*
