# monorep-bootstrap

Reusable monorepo starter for a `Next.js` UI and `Express` REST API with shared TypeScript and `zod` contracts, `PostgreSQL`, `Prisma`, and CI guardrails.

## Current Scope

Phase 1 establishes the workspace foundation:

- root `pnpm` workspace
- `turbo` task orchestration
- shared `tsconfig` package
- shared `eslint-config` package
- shared `types` package with a starter `zod` contract

Implementation spec: [docs/implementation-spec.md](/Users/ramanpreetaujla/Documents/AI-Projects/monorep-bootstrap/docs/implementation-spec.md)

## Planned Structure

```txt
apps/
  api/
  ui/

packages/
  eslint-config/
  tsconfig/
  types/
```

## Quickstart

```bash
pnpm install
pnpm build
pnpm lint
pnpm typecheck
```
