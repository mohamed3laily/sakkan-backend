# Authentication (Sakkan backend)

User and admin authentication flows. API paths assume **`/v1`** prefix.

---

## Concepts

| Concept | Meaning |
| ------- | ------- |
| **User JWT** | Short-lived Bearer access token; payload `{ sub, phone, sid }` where `sid` is the session id |
| **Refresh token** | Opaque token stored hashed in `user_sessions`; sent alone on `/v1/auth/refresh` |
| **Installation id** | Server-issued UUID returned on login/register/refresh; client stores and sends back on login to reuse the same session slot |
| **Device session** | One row in `user_sessions` per phone install; limits enforced by subscription `device_limit` |
| **Admin JWT** | Bearer token for admin panel; payload `{ sub, phone, name }` |
| **Phone verification** | Users must verify phone OTP before most protected routes |
| **`@AllowUnverified()`** | Bypasses phone verification check on specific routes |
| **`@Public()`** | Route accessible without JWT; valid token still attaches `user` if present |

---

## User auth routes

Controller: [`auth.controller.ts`](../src/modules/auth/auth.controller.ts)  
Service: [`auth.service.ts`](../src/modules/auth/auth.service.ts)

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| POST | `/v1/auth/register` | Public | Register; sends OTP; returns access + refresh tokens |
| POST | `/v1/auth/login` | Public | Login with phone + password; optional `deviceLabel` |
| POST | `/v1/auth/refresh` | Public | Rotate tokens; requires `refreshToken` only |
| POST | `/v1/auth/logout` | JWT + `@AllowUnverified()` | Revoke current device session only |
| POST | `/v1/auth/verify-phone` | JWT + `@AllowUnverified()` | Submit OTP token |
| POST | `/v1/auth/resend-verify-otp` | JWT + `@AllowUnverified()` | Resend verification OTP |
| POST | `/v1/auth/request-reset` | Public | Start password reset (OTP) |
| POST | `/v1/auth/resend-reset-otp` | Public | Resend reset OTP |
| POST | `/v1/auth/verify-reset-otp` | Public | Verify reset OTP |
| POST | `/v1/auth/reset-password` | Public | Set new password after OTP |
| POST | `/v1/auth/change-password` | JWT | Change password while logged in |

Auth endpoints use `@AuthThrottle()` or `@StrictAuthThrottle()` for rate limiting.

---

## User auth flow

### Register

1. Normalize phone via `PhoneUtils.normalizePhone`
2. Hash password (bcrypt, 10 rounds)
3. Generate 5-digit OTP, store with 10-minute expiry
4. Send OTP via [`TorvoSmsService`](../src/modules/sms/torvo-sms.service.ts)
5. Create device session in `user_sessions` (server-generated identity; optional `deviceLabel` from client for UI)
6. Return access token (JWT, ~30m), refresh token (opaque, 30d), and user profile

### Login

1. Lookup user by phone
2. Compare bcrypt password
3. Create new server session (see device limits below)
4. Return access + refresh tokens + user profile

### Device sessions and subscription limits

Sessions are stored in [`user_sessions`](../src/modules/db/schemas/monetization/user-sessions.ts). The **backend** assigns each session a server-generated **`installationId`** (returned on login/register/refresh). The mobile app stores it in secure storage and sends it back on **login** only — the app never generates it.

Optional `deviceLabel` (e.g. `"iPhone 15"`) is for display in the devices list only.

| Plan | `device_limit` |
| ---- | -------------- |
| Free / no subscription / Basic | 1 |
| Professional (1999 EGP) | 2 |
| Gold (4999 EGP) | 4 |

When a user logs in on a new device at the limit, the **oldest** active session is revoked automatically. To stay on the same session without consuming a slot, use **refresh** instead of login when tokens still exist.

When app data is cleared and the user logs in again, a **new session** is created (expected).

- **Logout** revokes the current session only (`sid` in JWT) and removes its FCM push token.
- **Password change / reset** revokes all sessions and clears all FCM push tokens.
- **Push token:** register per session via `PUT /v1/users/me/push-token` after login/refresh (not on profile update).
- **Manage devices:** `GET /v1/subscriptions/devices` returns `{ id, deviceLabel, lastSeenAt, createdAt }`; revoke via `POST /v1/subscriptions/devices/:sessionId/revoke`.

Service: [`user-session.service.ts`](../src/modules/auth/user-session.service.ts)

### JWT validation (`JwtStrategy`)

1. Extract Bearer token
2. Load user by `payload.sub`
3. Verify session `payload.sid` is active (not revoked, not expired)
4. If session is revoked or expired → `401` / `403` with structured `code` (see below)
5. If `verifiedPhoneAt` is null and route lacks `@AllowUnverified()` → `403 PHONE_NOT_VERIFIED`
6. Attach `{ id, phone, verified, sessionId }` to request as `user`

### Session revoke reasons and error `code` field

When `POST /v1/auth/refresh` or a JWT-protected call fails because the session ended, the API returns a stable machine-readable **`code`** (in addition to the translated `message`). Mobile clients should branch on `code`, not `message`.

Internal revoke reasons are stored in `user_sessions.revoked_reason` for audit. Only one scenario is exposed specifically to the frontend; all other revokes map to a generic code.

| `code` | HTTP | When | App behavior |
| ------ | ---- | ---- | ------------ |
| `SESSION_REVOKED_DEVICE_LIMIT` | 401 | Oldest session kicked because another device logged in at the plan limit | Show "signed out on another device" UI |
| `SESSION_REVOKED` | 401 | Logout, password change/reset, manual device revoke, subscription cancel, or legacy rows with no reason | Generic re-login |
| `SESSION_EXPIRED` | 401 | Refresh token or session past `expires_at` | Login screen |
| `ACCOUNT_DEACTIVATED` | 403 | User account deactivated | Account disabled screen |
| `INVALID_REFRESH_TOKEN` | 401 | Unknown or tampered refresh token | Login screen |

Example response (another device logged in):

```json
{
  "message": "Your session ended because your account was used on another device",
  "code": "SESSION_REVOKED_DEVICE_LIMIT"
}
```

Example response (logout / password change — same generic code):

```json
{
  "message": "Your session has ended. Please sign in again",
  "code": "SESSION_REVOKED"
}
```

Guard: [`jwt-auth.guard.ts`](../src/modules/auth/guards/jwt-auth.guard.ts)  
Payload type: [`jwt-payload.interface.ts`](../src/modules/auth/interfaces/jwt-payload.interface.ts)

---

## Admin auth routes

Controller: [`admin/auth/auth.controller.ts`](../src/admin/auth/auth.controller.ts)

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| POST | `/v1/register` | Public | Create admin account |
| POST | `/v1/login` | Public | Admin login |

**Important:** Admin routes have **no** `auth/` or `admin/` prefix. Do not confuse with `/v1/auth/login`.

Admin JWT strategy: [`admin-jwt.strategy.ts`](../src/admin/auth/strategies/admin-jwt.strategy.ts)  
Guard: [`admin-jwt-auth.guard.ts`](../src/admin/auth/guards/admin-jwt-auth.guard.ts)  
Decorator: `@CurrentAdmin()` for authenticated admin

Both user and admin strategies currently use `JWT_SECRET` from config (see `.env.example` for intended separate admin secret).

---

## Profile routes (`/v1/users/me`)

Controller: [`me.controller.ts`](../src/modules/user/me/me.controller.ts)  
All routes require `JwtAuthGuard` (phone must be verified unless `@AllowUnverified()` on specific handlers).

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/v1/users/me` | Current user profile |
| PUT | `/v1/users/me` | Update profile |
| PUT | `/v1/users/me/push-token` | Register FCM token for current session |
| PUT | `/v1/users/me/phone` | Change phone |
| PUT | `/v1/users/me/profile-picture` | Upload profile picture (S3) |
| DELETE | `/v1/users/me` | Delete account |
| GET | `/v1/users/me/preferences` | User preferences |

Nested via `RouterModule` in [`user.module.ts`](../src/modules/user/user.module.ts).

---

## Error keys (common)

| Key | When |
| --- | ---- |
| `PHONE_EXISTS` | Register with existing phone |
| `INVALID_CREDENTIALS` | Wrong phone/password on login |
| `INVALID_REFRESH_TOKEN` | Unknown or invalid refresh token |
| `SESSION_REVOKED_DEVICE_LIMIT` | Session revoked because another device logged in |
| `SESSION_REVOKED` | Session ended (logout, password change, device revoke, etc.) |
| `SESSION_EXPIRED` | Refresh token or session TTL elapsed |
| `ACCOUNT_DEACTIVATED` | User account deactivated |
| `PHONE_NOT_VERIFIED` | JWT user without verified phone |
| `USER_NOT_FOUND` | JWT references deleted user |

Translations: `src/i18n/en/auth.json`, `src/i18n/ar/auth.json`

---

## When modifying this area

1. New auth endpoint → add DTO, throttle decorator if public, i18n keys in both locales
2. Changing verification rules → update `JwtStrategy` and document `@AllowUnverified()` on affected routes
3. New admin route → use `AdminJwtAuthGuard`, not `JwtAuthGuard`
4. SMS changes → [`torvo-sms.service.ts`](../src/modules/sms/torvo-sms.service.ts)
5. Update [`api-routes.md`](api-routes.md) for new routes

---

*Update this file when auth flows or guards change.*
