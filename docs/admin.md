# Admin panel (Sakkan backend)

Admin authentication and moderation APIs. Paths assume **`/v1`** prefix.

---

## Concepts

| Concept | Meaning |
| ------- | ------- |
| **Admin JWT** | Separate Passport strategy; guard `AdminJwtAuthGuard` |
| **Admin routes** | Prefixed `/v1/admin/` except auth login/register |
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

---

## When modifying this area

1. New admin endpoint → `@UseGuards(AdminJwtAuthGuard)` + `@Controller('admin/...')`
2. Do not use `JwtAuthGuard` for admin routes (different strategy payload shape)
3. Admin auth changes → update [`docs/auth.md`](auth.md) pitfall section
4. New moderation action → add DTO, service method, repo query, update this doc and [`api-routes.md`](api-routes.md)

---

*Update this file when admin routes or guards change.*
