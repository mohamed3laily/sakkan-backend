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
| POST | `/v1/register` | Public | Register new admin |
| POST | `/v1/login` | Public | Admin login → JWT |

**Pitfall:** These routes have no `admin/` prefix. User auth is at `/v1/auth/*`.

Admin register DTO: name, phone, password — no registration token enforced in code yet (`.env.example` lists `ADMIN_REGISTRATION_TOKEN` for future use).

JWT config: [`admin/auth/auth.module.ts`](../src/admin/auth/auth.module.ts) — uses `JWT_SECRET`.

Use `@CurrentAdmin()` to inject authenticated admin on protected routes.

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

## Stats module

[`admin/stats/stats.module.ts`](../src/admin/stats/stats.module.ts) — empty placeholder, no routes yet.

---

## Error keys (common)

| Key | When |
| --- | ---- |
| `PHONE_EXISTS` | Admin register with existing phone |
| `INVALID_CREDENTIALS` | Wrong admin credentials |

---

## When modifying this area

1. New admin endpoint → `@UseGuards(AdminJwtAuthGuard)` + `@Controller('admin/...')`
2. Do not use `JwtAuthGuard` for admin routes (different strategy payload shape)
3. Admin auth changes → update [`docs/auth.md`](auth.md) pitfall section
4. New moderation action → add DTO, service method, repo query, update this doc and [`api-routes.md`](api-routes.md)

---

*Update this file when admin routes or guards change.*
