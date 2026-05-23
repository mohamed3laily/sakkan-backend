# AGENTS.md - Developer Guidelines for AI Agents

## Project Overview

NestJS + Drizzle ORM + PostgreSQL backend for real estate platform (Sakkan). TypeScript, JWT authentication, modular architecture.

---

## Commands

### Build & Run

```bash
npm run build          # Compile NestJS application
npm run start         # Run in production
npm run start:dev     # Run in watch mode (recommended)
npm run start:debug   # Run with debugger
```

### Linting & Formatting

```bash
npm run lint          # Lint and fix all .ts files
npm run format        # Format code with Prettier
```

### Database

```bash
npm run db:generate   # Generate Drizzle migrations
npm run db:migrate    # Run Drizzle migrations
npm run db:seed       # Seed the database
```

### Testing

```bash
npm run test          # Run all tests
npm run test:watch   # Run tests in watch mode
npm run test:cov     # Run tests with coverage
npm run test:e2e    # Run end-to-end tests
npx jest path/to/test.spec.ts  # Run single test file
```

---

## Code Style Guidelines

### General Rules

- Use TypeScript strict mode - always define types explicitly
- Use `async/await` instead of `.then()` chains

- Never use `any` unless absolutely necessary
- Use `const` by default, only use `let` when reassignment is needed
- Use `null` instead of `undefined` for optional values in database/JSON

### Imports

**Order imports groups (separate with blank lines):**

1. External libraries (NestJS, drizzle-orm, etc.)
2. Internal modules (relative paths)

```typescript
// ✅ Correct
import { Controller, Post, Body } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { AuthService } from './auth.service';
import { users } from '../db/schemas/schema-index';
```

### Naming Conventions

| Element             | Convention       | Example                      |
| ------------------- | ---------------- | ---------------------------- |
| Files               | kebab-case       | `auth.service.ts`            |
| Classes             | PascalCase       | `AuthService`, `RegisterDto` |
| Variables/Functions | camelCase        | `getUserById`                |
| Database tables     | snake_case       | `subscription_plans`         |
| Table columns       | snake_case       | `first_name`                 |
| DTOs                | PascalCase + Dto | `RegisterDto`                |
| Enums               | PascalCase       | `UserTypeEnum`               |

### Database Schema (Drizzle ORM)

```typescript
// Use inferred types
export type SelectUser = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Column naming - use TypeScript camelCase mapped to snake_case
firstName: varchar('first_name').notNull(),
```

### NestJS Patterns

**Service:**

```typescript
@Injectable()
export class AuthService {
  constructor(
    private authRepo: AuthRepo,
    private jwtService: JwtService,
  ) {}
}
```

**Repository:**

```typescript
@Injectable()
export class AuthRepo {
  constructor(private drizzleService: DrizzleService) {}

  async getUserByPhone(phone: string) {
    return this.drizzleService.db.query.users.findFirst({
      where: eq(users.phone, phone),
    });
  }
}
```

**Module:**

```typescript
@Module({
  imports: [DrizzleModule, ConfigModule],
  controllers: [AuthController],
  providers: [AuthService, AuthRepo],
  exports: [AuthService, AuthRepo],
})
export class AuthModule {}
```

### DTOs & Validation

```typescript
import { IsString, IsNotEmpty, IsIn } from 'class-validator';
import { userTypeEnum } from '../db/schemas/schema-index';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsIn(userTypeEnum.enumValues)
  type?: (typeof userTypeEnum.enumValues)[number];
}
```

### Error Handling

- Use NestJS built-in exceptions: `BadRequestException`, `UnauthorizedException`, `ConflictException`, `NotFoundException`
- Use i18n keys for error messages (e.g., `'PHONE_EXISTS'`, `'INVALID_CREDENTIALS'`)

```typescript
throw new ConflictException('PHONE_EXISTS');
throw new UnauthorizedException('INVALID_CREDENTIALS');
```

### Guards & Decorators

- Use `JwtAuthGuard` for protected routes
- Use `@CurrentUser()` to get authenticated user
- Use `@AllowUnverified()` for routes accessible without phone verification

```typescript
@UseGuards(JwtAuthGuard)
@Post('verify-phone')
verifyPhone(
  @Body() dto: VerifyPhoneDto,
  @CurrentUser() user: AuthenticatedUser,
) {}
```

---

## Project Structure

```
src/
├── modules/
│   ├── auth/
│   │   ├── dto/, interfaces/, strategies/, decorators/, guards/
│   │   ├── auth.service.ts, auth.controller.ts, auth.repo.ts, auth.module.ts
│   ├── db/
│   │   ├── schemas/ (schema-index.ts exports all schemas)
│   │   ├── drizzle.module.ts, drizzle.service.ts
│   └── [other modules]
├── common/ (decorators/, filters/, interceptors/, pipes/, services/)
└── seed.ts
```

---

## Important Notes

1. **Migrations**: Run `npm run db:generate` after creating/modifying schemas
2. **Seed Data**: Add to `src/seed.ts` for new tables
3. **i18n**: Error messages in `src/i18n/` - use translation keys, not hardcoded strings
4. **Config**: Use `.env` with `ConfigService.getOrThrow()` for required values
5. **Testing**: Create `.spec.ts` files in the same directory as the file being tested

---

## Architecture Map

All HTTP routes use URI versioning under **`/v1/`** (see `src/main.ts`). No global `/api` prefix.

### User modules (`src/modules/`)

| Module | Purpose |
| ------ | ------- |
| `auth` | User register/login, phone OTP, password reset |
| `user` | Agent discovery, `/me` profile, nested owner listings |
| `listing` | Public listing search/create, property types |
| `city` | Cities and areas catalog |
| `favorite` | Saved listings toggle |
| `report` | Report listings/users |
| `todo` | User todos with reminders |
| `note` | User notes |
| `preference` | User preferences |
| `monetization` | Subscriptions, credits, Paymob (via `BillingModule`) |
| `real-estate-developer` | Developer/project/property catalog |
| `notification` | In-app notifications + FCM push |
| `app-settings` | Public app configuration |
| `attachment` | S3 attachment records + orphan cleanup queue |
| `storage` | AWS S3 upload service (internal) |
| `sms` | Torvo SMS (internal) |
| `db` | Drizzle service, schemas, seeds |

### Admin modules (`src/admin/`)

| Module | Purpose |
| ------ | ------- |
| `auth` | Admin register/login (routes at `/v1/login`, `/v1/register`) |
| `listings` | Listing moderation (`/v1/admin/listings`) |
| `users` | User management (`/v1/admin/users`) |
| `stats` | Placeholder (empty stub) |

See [`docs/architecture.md`](docs/architecture.md) for system diagram and external services.

---

## Route Map (Quick Reference)

Full route table: [`docs/api-routes.md`](docs/api-routes.md).

| Prefix | Auth | Domain doc |
| ------ | ---- | ---------- |
| `/v1/auth/*` | Mixed | [`docs/auth.md`](docs/auth.md) |
| `/v1/login`, `/v1/register` | Public | Admin auth — [`docs/admin.md`](docs/admin.md) |
| `/v1/listings/*` | Mixed (`@Public()` on GET) | [`docs/listings.md`](docs/listings.md) |
| `/v1/users/me/*` | JWT | [`docs/auth.md`](docs/auth.md) |
| `/v1/users/me/listings/*` | JWT | [`docs/listings.md`](docs/listings.md) |
| `/v1/users/agents/*` | Mixed | User/agents |
| `/v1/subscriptions/*` | Mixed | [`docs/monetization.md`](docs/monetization.md) |
| `/v1/payments/*` | Paymob HMAC / redirect | [`docs/monetization.md`](docs/monetization.md) |
| `/v1/admin/*` | Admin JWT | [`docs/admin.md`](docs/admin.md) |
| `/v1/real-estate-developers/*` | Public (optional JWT) | Developer catalog |
| `/v1/cities/*` | Public | Geography |
| `/v1/favorites`, `/v1/reports`, `/v1/todos`, `/v1/notes`, `/v1/preferences` | JWT | Productivity |
| `/v1/notifications/*` | JWT | [`docs/background-jobs.md`](docs/background-jobs.md) |
| `/v1/app-settings` | Public | App config |

**Pitfall:** User login is `POST /v1/auth/login`. Admin login is `POST /v1/login` (no `auth/` prefix).

---

## Auth Model

### User JWT

- Strategy: `JwtStrategy` (`src/modules/auth/strategies/jwt.strategy.ts`)
- Secret: `JWT_SECRET`, expiry: `JWT_EXPIRES_IN`
- Payload: `{ sub: userId, phone }`
- Guard: `JwtAuthGuard` on most protected routes
- **Phone verification gate:** unverified users get `403 PHONE_NOT_VERIFIED` unless route has `@AllowUnverified()`
- **`@Public()`:** optional auth — valid Bearer token attaches `user`; missing token still allowed

### Admin JWT

- Strategy: `AdminJwtStrategy` (`src/admin/auth/strategies/admin-jwt.strategy.ts`)
- Same `JWT_SECRET` as users (see `.env.example` for intended separate admin secret in production)
- Guard: `AdminJwtAuthGuard` on `/v1/admin/*` routes
- Admin auth endpoints: `POST /v1/register`, `POST /v1/login` (no prefix)

Details: [`docs/auth.md`](docs/auth.md), [`docs/admin.md`](docs/admin.md).

---

## Background Infrastructure

Redis powers BullMQ queues (configured in `src/app.module.ts`):

| Queue | Job | Processor |
| ----- | --- | --------- |
| `city` | `increment-listing-count` | `src/modules/city/city.processor.ts` |
| `notification` | `dispatch-notification` | `src/modules/notification/jobs/notification.processor.ts` |
| `attachment` | `cleanup-orphans` | `src/modules/attachment/attachment.processor.ts` |

Cron schedulers (`@nestjs/schedule`):

| Schedule | Service | Purpose |
| -------- | ------- | ------- |
| Every 10 min | `SubscriptionExpiryScheduler` | Subscription expiry reminders |
| Every hour | `TodoReminderScheduler` | Todo due reminders |
| Daily midnight | `ListingExpiryService` | Expire premium listings |

Details: [`docs/background-jobs.md`](docs/background-jobs.md).

---

## Environment Variables

Copy `.env.example` to `.env`. Required vars by service:

| Group | Variables |
| ----- | ----------- |
| App | `NODE_ENV`, `PORT` |
| Database | `DATABASE_URL` |
| User JWT | `JWT_SECRET`, `JWT_EXPIRES_IN` |
| Admin JWT | `ADMIN_JWT_SECRET`, `ADMIN_JWT_EXPIRES_IN`, `ADMIN_REGISTRATION_TOKEN` (reserved; not yet enforced in code) |
| Redis | `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` (optional) |
| AWS S3 | `AWS_REGION`, `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` |
| SMS | `TORVO_SMS_API_KEY`, `TORVO_SMS_REQUEST_TIMEOUT_MS` (optional, default 20000) |
| Firebase FCM | `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` |
| Paymob | `PAYMOB_INTEGRATION_ID`, `PAYMOB_SECRET_KEY`, `PAYMOB_HMAC_SECRET`, `PAYMOB_PUBLIC_KEY` (Intention flow), `PAYMOB_API_KEY` + `PAYMOB_IFRAME_ID` (legacy flow), `PAYMOB_ACCEPT_HOST` (optional) |

---

## Safe Change Checklists

### New endpoint

1. Add DTO with `class-validator` decorators
2. Add controller method with correct guard (`JwtAuthGuard`, `AdminJwtAuthGuard`, or `@Public()`)
3. Implement logic in service; DB access in repo only
4. Throw i18n exception keys (not hardcoded strings)
5. Add translation keys to `src/i18n/en/` and `src/i18n/ar/`
6. Update [`docs/api-routes.md`](docs/api-routes.md) if adding a new route prefix

### Schema change

1. Edit schema in `src/modules/db/schemas/`
2. Export from `schema-index.ts`
3. `npm run db:generate` → review SQL in `drizzle/`
4. `npm run db:migrate`
5. Add/update seed in `src/seed.ts` if needed
6. Update relevant domain doc in `docs/`

---

## Documentation Index

| Doc | Topic |
| --- | ----- |
| [`docs/architecture.md`](docs/architecture.md) | System overview, modules, external services |
| [`docs/auth.md`](docs/auth.md) | User and admin authentication |
| [`docs/listings.md`](docs/listings.md) | Listings, tiers, geo, contact gate |
| [`docs/monetization.md`](docs/monetization.md) | Subscriptions, credits, Paymob |
| [`docs/admin.md`](docs/admin.md) | Admin panel routes |
| [`docs/api-routes.md`](docs/api-routes.md) | Complete HTTP route map |
| [`docs/background-jobs.md`](docs/background-jobs.md) | BullMQ queues and cron jobs |
