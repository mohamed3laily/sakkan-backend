# API Routes (Sakkan backend)

Complete HTTP route map. All paths prefixed with **`/v1/`** (URI versioning in [`main.ts`](../src/main.ts)).

Auth column: **Public** = no JWT required; **JWT** = user Bearer token; **Admin** = admin Bearer token; **Optional** = `@Public()` with JWT guard (token enriches response if present).

---

## Health

| Method | Path | Auth | Controller |
| ------ | ---- | ---- | ---------- |
| GET | `/v1/` | Public | `app.controller.ts` |

---

## User auth

See [`auth.md`](auth.md).

| Method | Path | Auth |
| ------ | ---- | ---- |
| POST | `/v1/auth/register` | Public |
| POST | `/v1/auth/login` | Public |
| POST | `/v1/auth/refresh` | Public |
| POST | `/v1/auth/logout` | JWT (unverified OK) |
| POST | `/v1/auth/verify-phone` | JWT (unverified OK) |
| POST | `/v1/auth/resend-verify-otp` | JWT (unverified OK) |
| POST | `/v1/auth/request-reset` | Public |
| POST | `/v1/auth/resend-reset-otp` | Public |
| POST | `/v1/auth/verify-reset-otp` | Public |
| POST | `/v1/auth/reset-password` | Public |
| POST | `/v1/auth/change-password` | JWT |

---

## Admin auth

See [`admin.md`](admin.md). **No `admin/` prefix on auth routes.**

| Method | Path | Auth |
| ------ | ---- | ---- |
| POST | `/v1/register` | Public |
| POST | `/v1/login` | Public |
| POST | `/v1/refresh` | Public |
| POST | `/v1/logout` | Admin |

---

## Listings

See [`listings.md`](listings.md).

| Method | Path | Auth |
| ------ | ---- | ---- |
| GET | `/v1/listings/property-types` | Public |
| POST | `/v1/listings` | JWT |
| GET | `/v1/listings` | Optional |
| GET | `/v1/listings/:id` | Optional |
| GET | `/v1/users/me/listings` | JWT |
| GET | `/v1/users/me/listings/:id` | JWT |
| DELETE | `/v1/users/me/listings/:id` | JWT |

---

## Users and agents

Nested via `RouterModule` in [`user.module.ts`](../src/modules/user/user.module.ts).

| Method | Path | Auth |
| ------ | ---- | ---- |
| GET | `/v1/users/agents` | Optional |
| GET | `/v1/users/agents/:id` | Optional |
| GET | `/v1/users/agents/:id/preferences` | Optional |
| GET | `/v1/users/agents/:agentId/reviews` | Public |
| POST | `/v1/users/agents/:agentId/reviews` | JWT |
| GET | `/v1/users/agents/:agentId/reviews/me` | JWT |
| PATCH | `/v1/users/agents/:agentId/reviews/me` | JWT |
| GET | `/v1/users/me` | JWT |
| PUT | `/v1/users/me` | JWT |
| PUT | `/v1/users/me/phone` | JWT |
| PUT | `/v1/users/me/profile-picture` | JWT |
| DELETE | `/v1/users/me` | JWT |
| GET | `/v1/users/me/preferences` | JWT |

---

## Subscriptions and payments

See [`monetization.md`](monetization.md).

| Method | Path | Auth |
| ------ | ---- | ---- |
| GET | `/v1/subscriptions/plans` | Public |
| GET | `/v1/subscriptions/credit-products` | Public |
| POST | `/v1/subscriptions/subscribe` | JWT |
| POST | `/v1/subscriptions/purchase/credits` | JWT |
| GET | `/v1/subscriptions/wallet` | JWT |
| GET | `/v1/subscriptions/devices` | JWT |
| POST | `/v1/subscriptions/devices/:sessionId/revoke` | JWT |
| POST | `/v1/subscriptions/listings/:id/reveal-serious` | JWT |
| POST | `/v1/subscriptions/testing/reset-subscription` | JWT + non-prod |
| POST | `/v1/payments/paymob-webhook` | Paymob HMAC |
| GET | `/v1/payments/paymob-return` | Public redirect |

---

## Admin moderation

See [`admin.md`](admin.md).

| Method | Path | Auth |
| ------ | ---- | ---- |
| GET | `/v1/admin/listings` | Admin |
| GET | `/v1/admin/listings/:id` | Admin |
| PATCH | `/v1/admin/listings/:id/status` | Admin |
| DELETE | `/v1/admin/listings/:id` | Admin |
| GET | `/v1/admin/users` | Admin |
| GET | `/v1/admin/users/:id` | Admin |
| PATCH | `/v1/admin/users/:id/deactivate` | Admin |
| DELETE | `/v1/admin/users/:id` | Admin |
| GET | `/v1/admin/cities` | Admin |
| POST | `/v1/admin/cities` | Admin |
| GET | `/v1/admin/cities/:id` | Admin |
| PATCH | `/v1/admin/cities/:id` | Admin |
| DELETE | `/v1/admin/cities/:id` | Admin |
| GET | `/v1/admin/cities/:cityId/areas` | Admin |
| POST | `/v1/admin/cities/:cityId/areas` | Admin |
| PATCH | `/v1/admin/cities/:cityId/areas/:areaId` | Admin |
| DELETE | `/v1/admin/cities/:cityId/areas/:areaId` | Admin |
| GET | `/v1/admin/subscription-plans` | Admin |
| GET | `/v1/admin/subscription-plans/:id` | Admin |
| PATCH | `/v1/admin/subscription-plans/:id` | Admin |
| GET | `/v1/admin/user-subscriptions/insights` | Admin |
| GET | `/v1/admin/user-subscriptions` | Admin |
| GET | `/v1/admin/user-subscriptions/:id` | Admin |
| PATCH | `/v1/admin/user-subscriptions/:id/cancel` | Admin |

---

## Real estate developers

Nested via `RouterModule` in [`real-estate-developer.module.ts`](../src/modules/real-estate-developer/real-estate-developer.module.ts).

| Method | Path | Auth |
| ------ | ---- | ---- |
| GET | `/v1/real-estate-developers` | Optional |
| GET | `/v1/real-estate-developers/projects` | Optional |
| GET | `/v1/real-estate-developers/projects/:projectId` | Optional |
| GET | `/v1/real-estate-developers/projects/:projectId/properties` | Optional |
| GET | `/v1/real-estate-developers/projects/:projectId/properties/:propertyId` | Optional |

---

## Geography

| Method | Path | Auth |
| ------ | ---- | ---- |
| GET | `/v1/cities` | Public |
| GET | `/v1/cities/:id/areas` | Public |

---

## Productivity

| Method | Path | Auth |
| ------ | ---- | ---- |
| POST | `/v1/favorites/toggle` | JWT |
| POST | `/v1/reports` | JWT |
| POST | `/v1/todos` | JWT |
| GET | `/v1/todos` | JWT |
| GET | `/v1/todos/:id` | JWT |
| PATCH | `/v1/todos/:id/toggle-done` | JWT |
| PATCH | `/v1/todos/:id` | JWT |
| DELETE | `/v1/todos/:id` | JWT |
| POST | `/v1/notes` | JWT |
| GET | `/v1/notes` | JWT |
| GET | `/v1/notes/:id` | JWT |
| PATCH | `/v1/notes/:id` | JWT |
| DELETE | `/v1/notes/:id` | JWT |
| POST | `/v1/preferences/toggle` | JWT |

---

## Notifications

See [`background-jobs.md`](background-jobs.md).

| Method | Path | Auth |
| ------ | ---- | ---- |
| POST | `/v1/notifications/test` | JWT + non-prod |
| GET | `/v1/notifications` | JWT |
| GET | `/v1/notifications/unread-count` | JWT |
| PATCH | `/v1/notifications/read-all` | JWT |

---

## App settings

| Method | Path | Auth |
| ------ | ---- | ---- |
| GET | `/v1/app-settings` | Public |
| GET | `/v1/admin/app-settings` | Admin JWT |
| PATCH | `/v1/admin/app-settings` | Admin JWT |

---

## When modifying this area

Update this file whenever adding, removing, or renaming controller routes.

---

*Generated from controllers; update when routes change.*
