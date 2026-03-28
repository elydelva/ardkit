# Code Conventions

## TypeScript

- Use `.js` extensions in all import paths (ES modules).
- Strict mode is non-negotiable: `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` are enabled.
- Tests are colocated as `.test.ts` files alongside the source they test.

## Pre-commit

Husky + lint-staged runs `biome check --write` on staged `.ts` files automatically. Do not skip it.
