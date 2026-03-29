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
