# Authentication (Sakkan backend)

User and admin authentication flows. API paths assume **`/v1`** prefix.

---

## Concepts

| Concept | Meaning |
| ------- | ------- |
| **User JWT** | Bearer token for mobile/app users; payload `{ sub, phone }` |
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
| POST | `/v1/auth/register` | Public | Register; sends OTP; returns JWT |
| POST | `/v1/auth/login` | Public | Login with phone + password |
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
5. Return JWT immediately (user can call verify-phone while unverified)

### Login

1. Lookup user by phone
2. Compare bcrypt password
3. Return JWT + user profile

### JWT validation (`JwtStrategy`)

1. Extract Bearer token
2. Load user by `payload.sub`
3. If `verifiedPhoneAt` is null and route lacks `@AllowUnverified()` → `403 PHONE_NOT_VERIFIED`
4. Attach `{ id, phone, verified }` to request as `user`

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
| `INVALID_CREDENTIALS` | Wrong phone/password |
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
