# ADRKit — Technical Architecture

> Internal document. Reference for any developer or agent working on the ADRKit codebase.

---

## Overview

ADRKit is a Bun monorepo. Bun operates at every level: workspace manager, runtime, test runner, bundler, and standalone binary compiler.

The architecture follows the hexagonal model: a pure core with no external dependencies, surrounded by adapters that implement ports. The final binary (`adrkit`) is the only place where everything connects.

```
packages/
├── core/           @adrkit/core       domain + ports + use cases
├── fs/             @adrkit/fs         filesystem adapter
├── git/            @adrkit/git        git adapter
├── lint/           @adrkit/lint       validation engine
├── tui/            @adrkit/tui        terminal interface (Ink)
├── sync/           @adrkit/sync       external adapters (Linear, GitHub)
└── adrkit/         adrkit             published binary — entry point + DI
```

---

## Dependency Rule

```
core
 ↑
 ├── fs
 ├── git
 ├── lint        (also depends on fs)
 ├── sync        (also depends on fs + git)
 └── tui
      ↑
    adrkit       (depends on everything — the only one allowed to)
```

`core` imports no other monorepo package. Adapters (`fs`, `git`, `sync`, `lint`) only import `core`. `tui` only imports `core`. `adrkit` is the only package that imports multiple packages — this is where DI wiring happens.

A violation of this rule is an architecture error. Eventually, a custom lint rule can enforce it in CI.

---

## Packages

### `@adrkit/core`

The domain core. No external dependencies except TypeScript types. Nothing related to files, git, or any framework.

**Responsibilities**

- Entities: `ADR`, `Task`, `Trace`, `Rule`, `Gate`, `Phase`
- Value objects: `ADRId`, `TaskId`, `TraceId`, `Status`, `Trigger`
- State machine: valid transitions between statuses (ADR and Task)
- DAG: dependency graph construction, cycle detection, `next` sort computation
- Ports: interfaces that adapters must implement
- Use cases: pure business logic, orchestrates ports

```
packages/core/src/
├── entities/
│   ├── adr.ts
│   ├── task.ts
│   ├── trace.ts
│   ├── rule.ts
│   └── gate.ts
├── value-objects/
│   ├── adr-id.ts
│   ├── status.ts
│   └── trigger.ts
├── ports/
│   ├── realm.repository.ts      # IRealmRepository
│   ├── git.adapter.ts           # IGitAdapter
│   ├── linter.adapter.ts        # ILinterAdapter
│   └── sync.adapter.ts          # ISyncAdapter
├── services/
│   ├── dag.service.ts           # DAG construction, cycles, next
│   ├── state-machine.service.ts # status transitions
│   └── rules.service.ts         # rule composition
├── use-cases/
│   ├── create-adr.ts
│   ├── complete-task.ts
│   ├── emit-trace.ts
│   ├── get-next.ts
│   ├── get-context.ts
│   └── lint-realm.ts
└── index.ts
```

**Port example**

```typescript
// ports/realm.repository.ts
export interface IRealmRepository {
  findADR(id: ADRId): Promise<ADR | null>
  findAllADRs(): Promise<ADR[]>
  saveADR(adr: ADR): Promise<void>
  findTask(id: TaskId): Promise<Task | null>
  findTasksForADR(adrId: ADRId): Promise<Task[]>
  saveTask(task: Task): Promise<void>
  appendTrace(trace: Trace): Promise<void>
  findTraces(filter: TraceFilter): Promise<Trace[]>
  getState(): Promise<RealmState>           // counters
  incrementCounter(entity: CounterKey): Promise<number>
}
```

---

### `@adrkit/fs`

Filesystem adapter. Implements `IRealmRepository`. Reads and writes `.md` files with YAML frontmatter. Parses `.adrconfig` and `.adrkit/.state`.

```
packages/fs/src/
├── parsers/
│   ├── frontmatter.parser.ts    # YAML frontmatter → typed entities
│   ├── adr.parser.ts
│   ├── task.parser.ts
│   └── trace.parser.ts
├── serializers/
│   ├── adr.serializer.ts        # entities → YAML frontmatter
│   ├── task.serializer.ts
│   └── trace.serializer.ts
├── config/
│   ├── adrconfig.reader.ts      # reads + validates .adrconfig
│   └── state.manager.ts         # reads/writes .adrkit/.state
├── realm.repository.ts          # IRealmRepository implementation
└── index.ts
```

**External dependencies**

```json
{
  "gray-matter": "^4.x",     // parse YAML/Markdown frontmatter
  "js-yaml": "^4.x",         // YAML serialization
  "@adrkit/core": "workspace:*"
}
```

**File naming convention**

The ID format is configured in `.adrconfig` (`id_format`). `@adrkit/fs` reads this format and applies it when naming files and directories. IDs are always zero-padded according to the config (`ADR-%04d` → `ADR-0001`).

---

### `@adrkit/git`

Git adapter. Implements `IGitAdapter`. All git operations go through `Bun.spawn` — no external git library in v1.

```
packages/git/src/
├── staging.ts          # git add on modified .adrkit/ files
├── history.ts          # git log filtered on .adrkit/ → enriched traces
├── merge-driver.ts     # max() logic for .adrkit/.state
├── hooks/
│   ├── generator.ts    # generates shell scripts for hooks
│   ├── pre-commit.sh   # template
│   ├── commit-msg.sh   # template
│   └── pre-push.sh     # template
├── git.adapter.ts      # IGitAdapter implementation
└── index.ts
```

**External dependencies**

```json
{
  "@adrkit/core": "workspace:*"
}
```

No `simple-git` or `isomorphic-git`. Operations are simple and `Bun.spawn` is sufficient. If complexity increases in v2, `isomorphic-git` can be introduced without changing the interface.

---

### `@adrkit/lint`

Realm validation engine. Implements `ILinterAdapter`. Each lint rule is an independent module that exports a `check` function.

```
packages/lint/src/
├── rules/
│   ├── L001-required-fields.ts
│   ├── L002-valid-status.ts
│   ├── L003-valid-type.ts
│   ├── L010-valid-depends-on.ts
│   ├── L011-valid-gates.ts
│   ├── L012-no-dependency-cycles.ts
│   ├── L020-valid-transition.ts
│   ├── L021-abandoned-requires-trace.ts
│   ├── L030-trace-immutable.ts
│   ├── L031-trace-valid-event.ts
│   ├── L040-rule-valid-trigger.ts
│   ├── L050-required-body-sections.ts
│   └── L051-heading-hierarchy.ts
├── runner.ts           # loads rules, runs on realm, aggregates results
├── reporter.ts         # formats results (text | json)
├── lint.adapter.ts     # ILinterAdapter implementation
└── index.ts
```

**Rule interface**

```typescript
export interface LintRule {
  id: string
  name: string
  level: 'error' | 'warning'
  check(realm: RealmSnapshot, config: ADRConfig): LintResult[]
}

export interface LintResult {
  rule: string
  level: 'error' | 'warning'
  entity: string       // e.g. "ADR-0001" or "TASK-0024"
  message: string
  file?: string
}
```

**Note on Rust**

In v1, the linter is entirely TypeScript. The `ILinterAdapter` interface allows substituting a Rust implementation (subprocess) without modifying the upper layers. The Rust runner (`adrkit-lint`) would be called via `Bun.spawn` and its JSON output parsed by the adapter.

---

### `@adrkit/tui`

Terminal interface built with Ink (React for the terminal). Depends only on `@adrkit/core` — receives use cases via injection, does not know about adapters.

```
packages/tui/src/
├── components/
│   ├── ProgressBar.tsx
│   ├── DAGGraph.tsx
│   ├── TraceFeed.tsx
│   ├── ADRDetail.tsx
│   └── StatusBadge.tsx
├── screens/
│   ├── MainScreen.tsx      # main layout
│   ├── ADRListScreen.tsx
│   └── ADRDetailScreen.tsx
├── hooks/
│   ├── useRealm.ts         # file watching + state
│   └── useKeyboard.ts      # keyboard shortcuts
├── App.tsx                 # root Ink component
└── index.ts                # exports render()
```

**External dependencies**

```json
{
  "ink": "^5.x",
  "react": "^18.x",
  "@adrkit/core": "workspace:*"
}
```

**File watching**

`Bun.watch()` on `.adrkit/` triggers a re-render of the global state. Ink re-renders only the affected components.

---

### `@adrkit/sync`

External synchronization adapters. Implements `ISyncAdapter` for Linear and GitHub. Each adapter is an independent module within the package.

```
packages/sync/src/
├── linear/
│   ├── linear.adapter.ts    # ISyncAdapter implementation via Linear CLI
│   ├── mapper.ts            # ADR ↔ Linear Issue
│   └── field-map.ts         # resolves field_map config
├── github/
│   ├── github.adapter.ts    # ISyncAdapter implementation via gh CLI
│   ├── mapper.ts
│   └── field-map.ts
├── registry.ts              # resolves which adapter to use based on config
└── index.ts
```

Adapters call external CLIs via `Bun.spawn`. No API keys stored in ADRKit.

---

### `adrkit` (published binary)

Entry point. The only non-scoped package. Wires all packages via DI and exposes CLI commands. Compiled to a standalone binary with `bun build --compile`.

```
packages/adrkit/src/
├── commands/
│   ├── new.ts
│   ├── edit.ts
│   ├── show.ts
│   ├── list.ts
│   ├── next.ts
│   ├── status.ts
│   ├── link.ts
│   ├── lint.ts
│   ├── context.ts
│   ├── history.ts
│   ├── graph.ts
│   ├── progress.ts
│   ├── tui.ts
│   ├── task/
│   │   ├── add.ts
│   │   ├── start.ts
│   │   ├── complete.ts
│   │   └── abandon.ts
│   ├── trace/
│   │   └── emit.ts
│   ├── rules/
│   │   └── ack.ts
│   ├── hooks/
│   │   ├── install.ts
│   │   ├── uninstall.ts
│   │   └── status.ts
│   └── sync/
│       └── index.ts
├── container.ts             # DI — instantiates and wires all adapters
├── cli.ts                   # command definitions (args, flags, help)
└── index.ts                 # entry point — parses args, dispatches command
```

**DI — `container.ts`**

```typescript
// container.ts
import { FSRealmRepository }   from '@adrkit/fs'
import { GitAdapter }          from '@adrkit/git'
import { LintAdapter }         from '@adrkit/lint'
import { SyncRegistry }        from '@adrkit/sync'
import { ADRConfig }           from '@adrkit/fs'
import {
  CreateADRUseCase,
  CompleteTaskUseCase,
  GetNextUseCase,
  // ...
} from '@adrkit/core'

export function buildContainer(realmPath: string) {
  const config   = ADRConfig.load(realmPath)
  const repo     = new FSRealmRepository(realmPath, config)
  const git      = new GitAdapter(realmPath)
  const linter   = new LintAdapter(config)
  const sync     = new SyncRegistry(config, repo, git)

  return {
    createADR:    new CreateADRUseCase(repo, git),
    completeTask: new CompleteTaskUseCase(repo, git),
    getNext:      new GetNextUseCase(repo),
    lint:         new LintRealmUseCase(repo, linter),
    sync,
    config,
    repo,
    git,
  }
}
```

**Binary build**

```bash
bun build packages/adrkit/src/index.ts \
  --compile \
  --outfile dist/adrkit \
  --target bun
```

The `dist/adrkit` binary is standalone — no Node, no Bun required on the target machine. This is the equivalent of `go build` for Go.

---

## Command Flow

Example: `adrkit task complete TASK-0041 --actor "agent:claude"`

```
index.ts
  → cli.ts          parses args, identifies command
  → container.ts    instantiates dependencies
  → commands/task/complete.ts
      → CompleteTaskUseCase.execute({ id: TASK-0041, actor: ... })
          → IRealmRepository.findTask(TASK-0041)      # @adrkit/fs reads file
          → StateMachineService.validateTransition()  # @adrkit/core validates
          → IRealmRepository.saveTask(updated)        # @adrkit/fs writes
          → IRealmRepository.appendTrace(trace)       # @adrkit/fs creates trace file
          → IGitAdapter.stage([taskFile, traceFile])  # @adrkit/git runs git add
      → stdout: "✓ TASK-0041 completed"
```

No layer knows what is happening in neighboring layers. `CompleteTaskUseCase` does not know that `IRealmRepository` writes files — it only knows to call the interface.

---

## Bun Configuration

**Root `package.json`**

```json
{
  "name": "adrkit-monorepo",
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "build":      "bun run --filter '*' build",
    "build:bin":  "bun build packages/adrkit/src/index.ts --compile --outfile dist/adrkit",
    "test":       "bun test --coverage",
    "test:watch": "bun test --watch",
    "lint:ts":    "tsc --noEmit --project tsconfig.base.json",
    "dev":        "bun run --filter 'adrkit' dev",
    "clean":      "bun run --filter '*' clean"
  }
}
```

**`bunfig.toml`**

```toml
[install]
exact = true

[test]
coverage = true
coverageThreshold = 0.8

[build]
sourcemap = "external"
```

**`tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "paths": {
      "@adrkit/core":   ["./packages/core/src/index.ts"],
      "@adrkit/fs":     ["./packages/fs/src/index.ts"],
      "@adrkit/git":    ["./packages/git/src/index.ts"],
      "@adrkit/lint":   ["./packages/lint/src/index.ts"],
      "@adrkit/tui":    ["./packages/tui/src/index.ts"],
      "@adrkit/sync":   ["./packages/sync/src/index.ts"]
    }
  }
}
```

---

## Testing Strategy

Each package has its own tests. `bun test` at the root runs all of them.

| Package | Strategy |
|---|---|
| `core` | Pure unit tests — no mocks needed, no external dependencies |
| `fs` | Tests on a temporary realm created in `/tmp` |
| `git` | Tests with a git repo initialized in `/tmp` |
| `lint` | Per-rule tests with fixture realms |
| `tui` | Ink component tests with `ink-testing-library` |
| `sync` | Integration tests with `Bun.spawn` mocks |
| `adrkit` | End-to-end tests on a complete realm in `/tmp` |

---

## Distribution

```
npm publish packages/adrkit    # publishes the compiled binary
```

The `adrkit` package is the only one published publicly. The `@adrkit/*` packages are private in v1 — they live in the monorepo. If extension or plugin needs emerge in v2, some may be published separately.

---

## Binding Technical Decisions

These decisions are frozen for v1. Any reconsideration goes through an ADR.

| Decision | Choice | Discarded alternative |
|---|---|---|
| Runtime | Bun | Node.js (slower), Deno (smaller ecosystem) |
| Language | Strict TypeScript | JavaScript (no typing), Go (different ecosystem) |
| TUI | Ink v5 | Bubble Tea (Go), Ratatui (Rust), OpenTUI (Zig) |
| Linter v1 | Integrated TypeScript | Rust subprocess (planned for v2 if perf insufficient) |
| YAML parser | gray-matter + js-yaml | @iarna/toml, JSON (lower readability) |
| Git ops | Bun.spawn | simple-git, isomorphic-git (overhead not justified in v1) |
| DI | Manual (container.ts) | inversify, tsyringe (over-engineering for this scope) |
| CLI parser | TBD — commander or clipanion | oclif (too heavy), yargs (aging API) |

---

*ADRKit Architecture Document — v1.0*
*Aligned with Founding Paper v0.5*
