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

- Node.js 22.12+, npm
- PostgreSQL 14+ (Prisma-managed schema)

## Local development

```bash
npm install
cp .env.example .env        # then edit values
npm run db:generate         # Prisma client → src/generated/prisma (gitignored)
npm run db:migrate          # dev migrations
npm run db:generate         # again after any schema change: migrate no longer generates
npm run db:seed:dev         # seeding is explicit too: migrate no longer seeds
npm run dev                 # nodemon
npm run build               # prisma generate + tsc → dist/
npm test                    # vitest
```

### Prisma

Prisma ORM 7, with the `prisma-client` generator and CommonJS output. A few rules to keep in mind:

- **Connection settings live in `prisma.config.ts`, not in the schema.** It loads `.env` itself
  and reads `DATABASE_URL`.
- **The app connects through the `pg` driver adapter (`@prisma/adapter-pg`)**, created in
  `src/lib/prisma.ts`. Import `PrismaClient`, `Prisma` and model types from
  `src/generated/prisma/client`, never from `@prisma/client`.
- **Upgrade `prisma`, `@prisma/client` and `@prisma/adapter-pg` together.** They are pinned to the
  same exact version because they are released in lockstep. Check the result with
  `npm ls prisma @prisma/client @prisma/adapter-pg pg`.

## Seeding a fresh database

`npm run db:seed` creates an active subscription for each of the two default organizations
(`bouc-io` on the Internal plan, `public` on Free). Without them, the portal has no subscription
state to return for users of those organizations. It uses the fixed organization IDs defined by
admin-api-server's seed.

User-level billing (invoices, payment methods) is not seeded; those records are created through
the API.

It is safe to re-run: an organization that already has an active subscription is skipped.

**Kubernetes.** Migrations run at container start, so seed once the pod is up:

```bash
kubectl exec -n default deploy/portal-api-chart -c portal-api-chart -- npm run db:seed
```

`-c portal-api-chart` selects the app container; the pod also runs the Istio sidecar.

**Local.** Use `npm run db:seed:dev` (ts-node, no build needed), or `npm run build && npm run db:seed`.

**Order on a fresh cluster.** Seed in this order:

1. **admin-api-server**: organizations and LLM assignment use cases.
2. **portal-api-server** (this service): organization subscriptions.
3. **agent-api-server**: the Tool table.

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
npm run build         # prisma generate + tsc
npm test              # vitest, unit tests only
npm run test:ci       # vitest + coverage, writes junit.xml and coverage/
```

CI runs `lint` and `unit-test` from the shared `bouc-io/ci-templates` project.

- **Lint uses a warning ratchet.** ESLint *errors* always fail the build. Warnings are
  capped by `max_warnings` in `.gitlab-ci.yml`, currently **3** (3 no-explicit-any). When you
  clean some up, lower the number. Never raise it, and never silence a rule repo-wide to
  get green.
- **Formatting is enforced.** `format:check` gates, using prettier defaults with no config
  file. The generated Prisma client is excluded via `.prettierignore` (and from ESLint and
  coverage).

Two things to know before you ever run a bulk reformat here:

- **Prettier needs two passes.** It breaks some method chains across lines on the first
  pass and collapses them back on the second, so a single
  `npm run format` can leave `format:check` failing.
- **Prettier can wrap a statement out from under an `eslint-disable-next-line`.** That is
  why the suppressions in this repo use block `/* eslint-disable rule */ ... /* eslint-enable rule */`
  pairs, which survive re-wrapping. Keep them that way.

## License

[Elastic License 2.0](./LICENSE) — source-available; not OSI open source.
