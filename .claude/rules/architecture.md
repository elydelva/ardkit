# Architecture

ADRKit is a hexagonal architecture TypeScript monorepo (Bun workspaces).

## Package dependency rules

`@adrkit/core` has **zero** monorepo dependencies. All adapter packages depend only on core. The `adrkit` binary is the **only** package allowed to import multiple packages — it is the sole DI wiring point.

```
packages/
├── core/    @adrkit/core   — domain entities, ports, services, use cases
├── fs/      @adrkit/fs     — IRealmRepository impl (YAML frontmatter via gray-matter)
├── git/     @adrkit/git    — IGitAdapter impl (git staging via Bun.spawn)
├── lint/    @adrkit/lint   — validation engine (stub in v0.1)
├── tui/     @adrkit/tui    — terminal UI via React/Ink (stub in v0.1)
├── sync/    @adrkit/sync   — Linear/GitHub adapters (stub in v0.1)
└── adrkit/  adrkit         — CLI entry point + dependency injection
```

## Core domain

**Entities:** `ADR`, `Task`, `Trace` — created via factory functions (not classes).

**Value objects:** `ADRId` (ADR-0001), `TaskId` (TASK-0024, realm-scoped globally unique), `ADRStatus`, `TaskStatus`.

**Services:**
- `StateMachineService` — enforces valid status transitions
- `DAGService` — dependency graph, cycle detection, `next` sort ordering

**Use cases** (`packages/core/src/use-cases/`): `CreateADRUseCase`, `CreateTaskUseCase`, `CompleteTaskUseCase`, `GetNextUseCase`, `GetContextUseCase`

**Ports:** `IRealmRepository` (CRUD + counters), `IGitAdapter` (stage, isRepo)

## File layout on disk

```
.adrconfig                              # project config (ID format, types, templates)
.adrkit/.state                          # persistent counters
.adrkit/ADR-XXXX-slug/ADR-XXXX.md      # ADR file (YAML frontmatter + Markdown body)
.adrkit/ADR-XXXX-slug/tasks/TASK-YYYY.md
.adrkit/ADR-XXXX-slug/traces/TRACE-ZZZZ.md
```

## Key domain concepts

- **Gates** — task dependency; Task A gates on Task B means B must complete first. Cross-ADR syntax: `ADR-0001/TASK-0003`.
- **Rules** — inline YAML frontmatter constraints (`before_edit`, `after_complete`, etc.) injected into agent system prompts.
- **Phases** — optional ADR field; used by `adrkit next` to prioritize work order.
- **Traces** — immutable audit log entries, one file per mutation.
