# Monorepo Bootstrap Implementation Spec

## Goal

This repository is a reusable monorepo starter intended to be forked for new products. It should provide a consistent, AI-friendly starting point for building one deployable web UI and one deployable REST API with shared types, shared schemas, trunk-based development, and opinionated delivery guardrails.

## Product And Platform Defaults

- Monorepo package manager: `pnpm`
- Monorepo task runner and caching: `turbo`
- UI app: `Next.js` + `React` + `TypeScript`
- API app: `Express` + `TypeScript`
- API style: `REST`
- Shared contracts: hand-authored TypeScript types plus `zod` schemas
- Database: `PostgreSQL`
- ORM: `Prisma` `7+`
- End-to-end testing: `Playwright`
- API integration testing: `Supertest`
- Unit testing: `Vitest`
- Linting: `ESLint`
- Formatting: `Prettier`
- CI: `GitHub Actions`
- Auth: intentionally excluded from the bootstrap and added per project

## Repository Shape

```txt
apps/
  api/
  ui/

packages/
  types/
  eslint-config/
  tsconfig/

infra/
  docker/

.github/
  workflows/

docs/

AGENTS.md
README.md
package.json
pnpm-workspace.yaml
turbo.json
```

## Directory Responsibilities

### `apps/api`

Purpose:
- deployable Express API
- REST endpoints
- request validation using shared `zod` schemas when applicable
- Prisma data access
- integration tests with `Supertest`

Expected structure:

```txt
apps/api/
  src/
    app.ts
    server.ts
    routes/
    middleware/
    lib/
  prisma/
    schema.prisma
    migrations/
    seed.ts
  tests/
  package.json
  tsconfig.json
```

### `apps/ui`

Purpose:
- deployable Next.js application
- consumes REST API
- imports shared types and schemas from `packages/types`
- hosts Playwright tests or integrates with root Playwright config

Expected structure:

```txt
apps/ui/
  src/
    app/
    components/
    lib/
  public/
  tests/
  package.json
  tsconfig.json
```

### `packages/types`

Purpose:
- shared domain types
- shared DTOs
- shared `zod` schemas
- schema-derived TypeScript types using `z.infer`

Expected structure:

```txt
packages/types/
  src/
    index.ts
    common/
    api/
    domain/
  package.json
  tsconfig.json
```

Guidelines:
- prefer `zod` schemas as the source of truth
- infer TypeScript types from schemas wherever practical
- keep framework-specific code out of this package

### `packages/eslint-config`

Purpose:
- reusable lint config shared by API, UI, and future packages

### `packages/tsconfig`

Purpose:
- reusable TypeScript base configs
- separate presets if needed for `next`, `node`, and `shared-library`

### `infra/docker`

Purpose:
- local infrastructure support, starting with PostgreSQL

Expected contents:
- `docker-compose.yml` or a clearly named compose file for local development

## Workspace Tooling

### Root `package.json`

Root scripts should act as the main developer entry points.

Recommended scripts:

```json
{
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "typecheck": "turbo typecheck",
    "test": "turbo test",
    "test:unit": "turbo test:unit",
    "test:integration": "turbo test:integration",
    "test:e2e": "turbo test:e2e",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "db:up": "docker compose -f infra/docker/docker-compose.yml up -d",
    "db:down": "docker compose -f infra/docker/docker-compose.yml down",
    "db:reset": "pnpm --filter api prisma migrate reset",
    "prepare": "husky"
  }
}
```

### `pnpm-workspace.yaml`

Should include:

```yaml
packages:
  - apps/*
  - packages/*
```

### `turbo.json`

Should define task dependencies and outputs for:
- `build`
- `lint`
- `typecheck`
- `test`
- `test:unit`
- `test:integration`
- `test:e2e`
- `dev`

## Shared Contract Strategy

Shared contracts live in `packages/types`.

Recommended pattern:
- define `zod` schema first
- derive the TypeScript type from the schema
- export both schema and type

Example:

```ts
import { z } from "zod";

export const CreateUserSchema = z.object({
  email: z.email(),
  name: z.string().min(1),
});

export type CreateUser = z.infer<typeof CreateUserSchema>;
```

Usage guidance:
- API validates incoming payloads with shared schemas
- UI uses the same schemas for client validation where appropriate
- avoid duplicate request and response typing in separate apps

## API Conventions

### Express App

Default API decisions:
- `Express` as the HTTP framework
- one `app.ts` for app composition
- one `server.ts` for process startup
- route modules grouped by resource
- centralized error-handling middleware
- request validation middleware powered by shared `zod` schemas

### REST Conventions

Baseline expectations:
- `/api/v1` version prefix
- JSON request and response bodies
- health endpoint for CI and container checks
- predictable error response format

Suggested error shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": []
  }
}
```

### Prisma Conventions

Initial requirements:
- Prisma schema lives under `apps/api/prisma/schema.prisma`
- migrations are committed
- include a seed script
- generated Prisma client should be reproducible in CI

Recommended scripts in `apps/api`:
- `prisma:generate`
- `prisma:migrate:dev`
- `prisma:migrate:deploy`
- `prisma:studio`
- `prisma:seed`

## UI Conventions

### Next.js App

Default UI decisions:
- App Router
- TypeScript enabled
- server and client components used intentionally
- API base URL configured through environment variables

Guidance:
- shared DTOs and schemas imported from `packages/types`
- no UI-specific copies of API types
- prepare for one deployable frontend only

## Testing Strategy

Three testing layers should be included from the start.

### Unit Tests

Tool:
- `Vitest`

Scope:
- utility functions
- schema helpers
- isolated domain logic
- API helpers and middleware where mocking is sufficient

### Integration Tests

Tools:
- `Vitest` or test runner chosen for the API package
- `Supertest`
- PostgreSQL test database

Scope:
- Express routes
- middleware behavior
- database-backed endpoint behavior

Requirements:
- integration tests run against a real test database
- test database setup and teardown are scripted

### End-To-End Tests

Tool:
- `Playwright`

Scope:
- smoke test for app boot
- UI to API happy path
- essential regression paths only in bootstrap

## Environment And Secrets Strategy

The bootstrap should include:
- root `.gitignore`
- root `.env.example`
- app-specific `.env.example` files if needed
- runtime environment validation

Guidelines:
- never commit real secrets
- document required variables in `README.md`
- validate env vars on startup in API and UI

Suggested initial variables:
- `DATABASE_URL`
- `PORT`
- `NEXT_PUBLIC_API_BASE_URL`
- `NODE_ENV`

## Local Development Experience

The repository should support a new fork being usable quickly.

Minimum onboarding flow:
1. `pnpm install`
2. `pnpm db:up`
3. configure `.env`
4. `pnpm dev`

Recommended quality-of-life additions:
- `docker compose` for local PostgreSQL
- a healthcheck endpoint in API
- clear README quickstart
- optional seed data for local development

## AI-First Development Contract

`AGENTS.md` should be the first document an AI agent reads before making changes in the repository.

It should define:
- repository purpose
- monorepo structure
- package responsibilities
- branch naming rules
- commit message rules
- testing expectations before completion
- code change boundaries
- how to add new packages or apps
- how to handle shared types and schemas
- CI expectations

It should also explicitly instruct AI agents to:
- prefer shared contracts from `packages/types`
- avoid creating duplicate types in app-local code
- keep auth out of bootstrap unless a project explicitly adds it
- keep changes small and trunk-friendly

## Branching And Commit Rules

### Branch Naming

Allowed formats:
- `feat/<JIRA-ISSUE-NUMBER>-<short-description>`
- `fix/<JIRA-ISSUE-NUMBER>-<short-description>`
- `chore/<JIRA-ISSUE-NUMBER>-<short-description>`

Examples:
- `feat/CROWN-123-add-user-route`
- `fix/CROWN-212-handle-db-timeout`
- `chore/CROWN-300-upgrade-prisma`

### Commit Messages

Required format:

```txt
<branch-prefix>: <JIRA-ISSUE-NUMBER> - <one line message>
```

Examples:
- `feat: CROWN-123 - add healthcheck endpoint`
- `fix: CROWN-212 - handle missing database connection`
- `chore: CROWN-300 - configure turbo cache`

Rules:
- one line only
- semantic prefix must match branch intent
- message should describe the change, not the process

## Trunk-Based Development Rules

The bootstrap should assume trunk-based delivery.

Working rules:
- `main` is always releasable
- branches are short-lived
- PRs stay small
- long-running feature branches are discouraged
- use feature flags if a change cannot be completed in one short-lived branch

## GitHub Repository Enforcement

Some requirements are policy and must be configured in GitHub, not only documented in the repo.

### Branch Protection Or Rulesets For `main`

Enforce:
- pull request required before merge
- squash merge only
- block direct pushes to `main`
- require status checks to pass
- require branch to be up to date before merge if desired
- require linear history if compatible with squash-only policy

### Merge Strategy

Repository settings should allow:
- squash merge: enabled

Repository settings should disable:
- merge commit
- rebase merge

### Status Checks

Recommended required checks:
- `lint`
- `typecheck`
- `test-unit`
- `test-integration`
- `test-e2e` or at least a smoke variant
- `build`

### Commit And Branch Validation

To enforce conventions earlier than PR review, add:
- branch name validation in local hooks and CI
- commit message validation in local hooks and CI

This can be implemented with:
- `Husky`
- `commitlint` or a small custom validation script

## CI Pipeline Specification

CI should run on pull requests and pushes to `main`.

### Minimum Jobs

#### `quality`

Runs:
- dependency install
- lint
- typecheck
- format check

#### `test-api`

Runs:
- Prisma generate
- Prisma migrations for test database
- API integration tests with PostgreSQL service container

#### `test-ui`

Runs:
- UI build
- Playwright smoke or e2e tests

#### `build`

Runs:
- monorepo production build

### CI Notes

Recommended implementation details:
- cache `pnpm` store
- cache Turbo artifacts where useful
- use a PostgreSQL GitHub Actions service container
- ensure Prisma commands run in the API package context

### Required GitHub Actions Files

At minimum:

```txt
.github/workflows/ci.yml
```

Optional later:
- `.github/workflows/dependency-updates.yml`
- `.github/workflows/release.yml`

## Dependency Management

Recommended:
- `Renovate` or `Dependabot`

Goal:
- keep framework and infrastructure dependencies current
- reduce upgrade spikes in starter repos

## Documentation Requirements

### `README.md`

Should contain:
- what the repository is for
- stack summary
- quickstart
- workspace structure
- local database startup
- common scripts
- link to `AGENTS.md`

### `docs/`

Can include:
- architecture notes
- decisions log
- extension guidance for future apps and packages

## Suggested Phased Implementation Order

### Phase 1: Workspace Foundation

Create:
- root `package.json`
- `pnpm-workspace.yaml`
- `turbo.json`
- root `.gitignore`
- root `.npmrc` if needed
- base README

Create packages:
- `packages/tsconfig`
- `packages/eslint-config`
- `packages/types`

### Phase 2: Application Scaffolding

Create:
- `apps/ui` with Next.js
- `apps/api` with Express + TypeScript

Add:
- shared imports from `packages/types`
- base health endpoint
- API error middleware

### Phase 3: Database Layer

Add:
- PostgreSQL docker compose
- Prisma schema
- migrations
- seed script
- database scripts

### Phase 4: Test Infrastructure

Add:
- unit test setup
- `Supertest` integration setup
- `Playwright` setup
- minimal passing smoke tests

### Phase 5: Delivery Guardrails

Add:
- `AGENTS.md`
- Husky hooks
- branch name validation
- commit message validation
- GitHub Actions CI

### Phase 6: Repository Hardening

Configure in GitHub:
- branch protection or rulesets
- squash-only merges
- required status checks
- optional dependency automation

## Non-Goals For The Bootstrap

The starter should not include these by default:
- authentication and authorization implementation
- project-specific domain models beyond a minimal example
- third-party payment, email, or storage vendors
- complex deployment platform coupling
- multiple deployable frontends or backends from day one

## Definition Of Done For The Bootstrap

The bootstrap is complete when:
- a new fork can install and run locally with one PostgreSQL container
- `apps/ui` and `apps/api` both build successfully
- shared contracts compile from `packages/types`
- Prisma migrations run successfully
- unit, integration, and e2e smoke tests pass
- CI passes on pull requests
- `AGENTS.md` documents the development contract
- GitHub settings are documented for squash-only trunk-based flow
