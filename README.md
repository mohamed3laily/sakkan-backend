# Sakkan Backend

NestJS + Drizzle ORM + PostgreSQL backend for the Sakkan real-estate platform.

## For AI agents and developers

Start here:

- **[AGENTS.md](AGENTS.md)** — commands, conventions, architecture map, change checklists
- **[docs/](docs/)** — domain documentation (auth, listings, monetization, admin, API routes, jobs)

## Quick start

```bash
npm install
cp .env.example .env   # fill in required values
npm run db:migrate
npm run start:dev
```

All API routes use the **`/v1/`** prefix.

## Commands

| Command | Purpose |
| ------- | ------- |
| `npm run start:dev` | Dev server (watch mode) |
| `npm run build` | Compile |
| `npm run lint` | ESLint + fix |
| `npm run db:generate` | Generate Drizzle migration |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Seed database |
| `npm run test` | Run tests |

See [AGENTS.md](AGENTS.md) for full command reference.
