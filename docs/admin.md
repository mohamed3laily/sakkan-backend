# Admin panel (Sakkan backend)

Admin authentication and moderation APIs. Paths assume **`/v1`** prefix.

---

## Concepts

| Concept | Meaning |
| ------- | ------- |
| **Admin JWT** | Separate Passport strategy; guard `AdminJwtAuthGuard` |
| **Admin routes** | Prefixed `/v1/admin/` except auth login/register |
| **Raw admin responses** | Optional header `X-Raw-Response: true` skips bilingual field merging on admin routes |
| **Moderation** | Update listing status, delete listings/users |

---

## Admin auth

Controller: [`admin/auth/auth.controller.ts`](../src/admin/auth/auth.controller.ts)

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| POST | `/v1/register` | Public | Register new admin; returns access + refresh tokens |
| POST | `/v1/login` | Public | Admin login → access + refresh tokens |
| POST | `/v1/refresh` | Public | Rotate tokens; requires `refreshToken` only |
| POST | `/v1/logout` | Admin JWT | Revoke current session |

**Pitfall:** These routes have no `admin/` prefix. User auth is at `/v1/auth/*`.

Admin register/login DTO: name, phone, password.

JWT payload: `{ sub, phone, name, sid }` where `sid` is the admin session id. Access token config: `ADMIN_JWT_SECRET`, `ADMIN_JWT_EXPIRES_IN`. Refresh tokens are opaque, stored hashed in `admin_sessions` (30-day TTL).

Use `@CurrentAdmin()` to inject authenticated admin on protected routes (`sessionId` available for logout).

### Raw bilingual fields

Admin panel editors often need both locale columns (e.g. `nameEn` / `nameAr`) instead of a single merged field. Send this optional header on any `/v1/admin/*` request:

```
X-Raw-Response: true
```

When present, the global translation interceptors are skipped for that request. Responses keep separate `*En` / `*Ar` fields and are not shaped by `Accept-Language`. Omit the header (default) for merged, locale-aware responses like the mobile app.

---

## Listing moderation

Controller: [`admin/listings/listings.controller.ts`](../src/admin/listings/listings.controller.ts)  
Guard: `AdminJwtAuthGuard`

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/v1/admin/listings` | List listings (shared query DTO with public API) |
| GET | `/v1/admin/listings/:id` | Listing detail |
| PATCH | `/v1/admin/listings/:id/status` | Update listing status |
| DELETE | `/v1/admin/listings/:id` | Delete listing |

Service: [`admin/listings/listings.service.ts`](../src/admin/listings/listings.service.ts)

---

## User management

Controller: [`admin/users/users.controller.ts`](../src/admin/users/users.controller.ts)  
Guard: `AdminJwtAuthGuard`

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/v1/admin/users` | List users |
| GET | `/v1/admin/users/:id` | User detail |
| PATCH | `/v1/admin/users/:id/deactivate` | Toggle user deactivation |
| DELETE | `/v1/admin/users/:id` | Delete user |

---

## Cities and districts

Controller: [`admin/cities/cities.controller.ts`](../src/admin/cities/cities.controller.ts)  
Guard: `AdminJwtAuthGuard`

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/v1/admin/cities` | List cities (paginated, optional `search`) |
| POST | `/v1/admin/cities` | Create city |
| GET | `/v1/admin/cities/:id` | City detail with nested `districts` |
| PATCH | `/v1/admin/cities/:id` | Update city |
| DELETE | `/v1/admin/cities/:id` | Delete city (blocked if listings exist) |
| GET | `/v1/admin/cities/:cityId/areas` | List districts for a city |
| POST | `/v1/admin/cities/:cityId/areas` | Create district |
| PATCH | `/v1/admin/cities/:cityId/areas/:areaId` | Update district |
| DELETE | `/v1/admin/cities/:cityId/areas/:areaId` | Delete district (blocked if used in listings) |

City fields: `nameEn`, `nameAr`, optional `latitude` / `longitude`. Response includes `listingCount` and `areasCount`.

District fields: `nameEn`, `nameAr`, optional `latitude` / `longitude` / `geometry`.

---

## Subscription plans

Controller: [`admin/subscription-plans/subscription-plans.controller.ts`](../src/admin/subscription-plans/subscription-plans.controller.ts)  
Guard: `AdminJwtAuthGuard`

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/v1/admin/subscription-plans` | List all plans (active and inactive) |
| GET | `/v1/admin/subscription-plans/:id` | Plan detail |
| PATCH | `/v1/admin/subscription-plans/:id` | Update plan (no create/delete) |

Response uses `featuredAdViewsQuotaPerMonth` (maps from DB `featured_ad_quota_per_month`). `name` and `billingPeriod` are not editable via PATCH.

---

## User subscriptions

Controller: [`admin/user-subscriptions/user-subscriptions.controller.ts`](../src/admin/user-subscriptions/user-subscriptions.controller.ts)  
Guard: `AdminJwtAuthGuard`

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/v1/admin/user-subscriptions/insights` | Totals: all subscriptions, active count, current revenue (EGP) |
| GET | `/v1/admin/user-subscriptions` | Paginated list (`page`, `limit`, optional `search`) |
| GET | `/v1/admin/user-subscriptions/:id` | Subscription detail |
| PATCH | `/v1/admin/user-subscriptions/:id/cancel` | Cancel active subscription; revokes user sessions |

List rows include `displayStatus`: `active` when `status = active` and `periodEnd > now`, else `expired`.

---

## App settings

Controller: [`admin/app-settings/app-settings.controller.ts`](../src/admin/app-settings/app-settings.controller.ts)  
Guard: `AdminJwtAuthGuard`

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/v1/admin/app-settings` | Get the app settings singleton |
| PATCH | `/v1/admin/app-settings` | Update app settings |

Fields: `phones` (string array), `email`, `termsAndConditionsEn`, `termsAndConditionsAr`, optional `privacyPolicyEn` / `privacyPolicyAr`.

Public read-only endpoint remains `GET /v1/app-settings` (excludes `id` and timestamps).

---

## Stats module

[`admin/stats/stats.module.ts`](../src/admin/stats/stats.module.ts) — empty placeholder, no routes yet.

---

## Error keys (common)

| Key | When |
| --- | ---- |
| `PHONE_EXISTS` | Admin register with existing phone |
| `INVALID_CREDENTIALS` | Wrong admin credentials |
| `CITY_NOT_FOUND` | City id not found |
| `CITY_NAME_EXISTS` | Duplicate English city name |
| `CITY_HAS_LISTINGS` | Delete city with listings |
| `AREA_NOT_FOUND` | District id not found for city |
| `AREA_IN_USE` | Delete district referenced by listings |
| `SUBSCRIPTION_NOT_FOUND` | User subscription id not found |
| `SUBSCRIPTION_NOT_ACTIVE` | Cancel on inactive or expired subscription |

---

## When modifying this area

1. New admin endpoint → `@UseGuards(AdminJwtAuthGuard)` + `@Controller('admin/...')`
2. Do not use `JwtAuthGuard` for admin routes (different strategy payload shape)
3. Admin auth changes → update [`docs/auth.md`](auth.md) pitfall section
4. New moderation action → add DTO, service method, repo query, update this doc and [`api-routes.md`](api-routes.md)

---

*Update this file when admin routes or guards change.*
