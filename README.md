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

Interactive docs are served at `/api-docs` unconditionally, and the raw spec at
`/openapi.json`. Neither path is routed at the edge: access is gated by Istio and oauth2-proxy,
not by `NODE_ENV`. `apidocs-api-server` reads the spec in-mesh and aggregates it at
`api.<domain>/v1/api-docs`.

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
| `NODE_ENV` | `development` | Standard Node environment flag; it does NOT gate `/api-docs` |
| `LOG_LEVEL` | `info` | Pino level: `trace`/`debug`/`info`/`warn`/`error` |
| `DATABASE_URL` | `postgresql://portal:portal@localhost:5432/portaldb` | Postgres connection string |

## Quality Gates

```bash
npm run lint          # ESLint (flat config)
npm run lint:fix      # auto-fix what is mechanically fixable
npm run format:check  # prettier, check only
npm run format        # prettier, write
npm run build         # tsc
npm test              # vitest, unit tests only
npm run test:ci       # vitest + coverage, writes junit.xml and coverage/
```

CI runs `lint` and `unit-test` from the shared `bouc-io/ci-templates` project.

- **Lint uses a warning ratchet.** ESLint *errors* always fail the build. Warnings are
  capped by `max_warnings` in `.gitlab-ci.yml`, currently **3** (3 no-explicit-any). When you
  clean some up, lower the number. Never raise it, and never silence a rule repo-wide to
  get green.
- **Formatting is enforced.** `format:check` gates, using prettier defaults with no config
  file.

Two things to know before you ever run a bulk reformat here:

- **Prettier needs two passes.** It breaks some method chains across lines on the first
  pass and collapses them back on the second, so a single
  `npm run format` can leave `format:check` failing.
- **Prettier can wrap a statement out from under an `eslint-disable-next-line`.** That is
  why the suppressions in this repo use block `/* eslint-disable rule */ ... /* eslint-enable rule */`
  pairs, which survive re-wrapping. Keep them that way.

## License

[Elastic License 2.0](./LICENSE) — source-available; not OSI open source.
