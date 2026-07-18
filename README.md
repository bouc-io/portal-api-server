# portal-api-server

User-facing portal backend for the **bouc.io AI assistant platform**. Manages
**personal, user-scoped instructions** (fetched by `agent-api-server` at run
start, merged by priority with the global/org instructions that come from
`admin-api-server`), plus per-user billing and payment-method records.

Part of the [bouc.io AI platform](../../../documentation/getting-started/README.md#ai-assistant-platform).

## Role in the platform

```
 agent-api-server ──(run start, parallel fetch)──▶ admin-api-server   (global + org instructions)
        │                                          portal-api-server  (personal instructions)
        └────────────── merged by priority ───────────────┘
```

`portal-api-server` owns the `/v1/portal/*` surface. All routes require a valid
JWT (Keycloak `realm_access.roles` or OAuth2-Proxy injected headers); see
`src/lib/roles.ts` for the role constants.

## API overview

Interactive docs are available at `/api-docs` when `NODE_ENV !== production`.

| Method | Path | Purpose |
|---|---|---|
| GET | `/v1/portal/health` | Liveness / version (unguarded) |
| GET/POST/PUT/PATCH/DELETE | `/v1/portal/instructions` | CRUD + toggle personal instructions |
| GET | `/v1/portal/config` | User-scoped config |
| GET/PUT | `/v1/portal/billings/subscription` | Read / update subscription |
| GET | `/v1/portal/billings/invoices` | List / fetch invoices |
| GET/PUT | `/v1/portal/payments` | List / upsert payment method |

Mutating routes are validated with zod (`src/middleware/validate.ts`); errors
return the platform-standard `{ error: { code, message, details? } }` shape.

## Prerequisites

- Node.js 20+, npm
- PostgreSQL 14+ (Prisma-managed schema)

## Local development

```bash
npm install
cp .env.example .env        # then edit values
npm run db:generate         # Prisma client
npm run db:migrate          # dev migrations
npm run dev                 # nodemon
npm run build               # tsc → dist/
npm test                    # vitest
```

## Environment variables

| Variable | Example | Purpose |
|---|---|---|
| `PORT` | `3001` | HTTP listen port |
| `NODE_ENV` | `development` | `development` enables `/api-docs`; `production` disables it |
| `LOG_LEVEL` | `info` | Pino level: `trace`/`debug`/`info`/`warn`/`error` |
| `DATABASE_URL` | `postgresql://portal:portal@localhost:5432/portaldb` | Postgres connection string |

## License

[Elastic License 2.0](./LICENSE) — source-available; not OSI open source.
