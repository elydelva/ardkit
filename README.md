# ADRKit

> *Git tracks what changed. ADRKit tracks why.*

---

You're building with AI agents. Your codebase moves faster than ever. But the agents don't know why you made that call three weeks ago — and neither will you in six months.

ADRKit is a decision layer that lives inside your repository. Every architectural choice, documented and versioned alongside the code it describes. Every agent that touches your project gets the context and rules before it acts.

No PM required. No external board. No documentation that rots because it lives somewhere else.

---

## The idea

Every project has two layers: the technical and the operational. As a solo dev or small team, you've always had to choose between maintaining the operational layer and actually shipping.

ADRKit automates the operational layer.

You describe a decision. ADRKit creates the structure — tasks, dependencies, rules. Your agents read that structure, know what to do next, and follow the constraints you set. You stay in the technical layer. The rest runs itself.

```bash
# You have an idea
adrkit new --title "Switch auth to JWT + refresh tokens" --type tech-choice

# ADR-0012 created. Tasks generated. Dependencies mapped.
# Your agent now has context before it touches a single file.

adrkit context --active | pbcopy
# → paste into your agent. It knows the why, the rules, the order.

adrkit next
# → TASK-0041: Implement token rotation logic
#    3 other tasks will unblock after this one. Start here.
```

---

## Why it works for AI-assisted development

Agents are fast. They're also stateless — they have no memory of the decision that shaped the file they're about to rewrite.

ADRKit gives them that memory, in a format they can actually use:

```bash
adrkit context --task TASK-0041 --json
# Returns: current ADR state, applicable rules, blocked tasks,
#          what depends on this, what this depends on.
# One command. Inject into system prompt. Done.
```

And when an agent marks something complete, it's logged — with a trace, an actor, a timestamp. The audit trail is automatic.

```bash
adrkit task complete TASK-0041 --actor "agent:claude" --message "Token rotation implemented"
# → task status updated
# → trace emitted
# → next task unblocked
# → git staged, ready for your commit
```

---

## Rules that run

You write constraints once. Every agent that works in your codebase respects them — enforced by git hooks, not trust.

```yaml
# In any ADR or task frontmatter
rules:
  - trigger: before_edit
    instruction: >
      Use defineMappedTable from @justwant/db.
      camelCase in TypeScript, snake_case in DB. No exceptions.
  - trigger: before_complete
    instruction: >
      Schema must pass drizzle-kit check before this task is marked done.
```

The `pre-commit` hook runs `adrkit lint` on every commit touching `.adrkit/`. It doesn't matter if a human or an agent wrote the files — the hook doesn't care.

---

## What it looks like day to day

A solo dev building a SaaS with AI agents:

```
Morning: adrkit next
→ shows what to work on, in priority order, with context

During the day: agents execute tasks, emit traces, advance state

Evening: git add .adrkit/ && git commit -m "ADR-0012: auth layer done"
→ code and decisions, versioned together
```

Six months later, a new developer (or a new agent) joins the project:

```bash
adrkit history --global
# Full decision timeline. Every choice, every tradeoff, who made it, why.

adrkit show ADR-0012
# The full auth decision: options considered, what was chosen, why,
# every task that was completed, every agent that touched it.
```

---

## Not just for solo devs

**Small teams without a PM** — ADRKit is the shared operational brain. Everyone knows what's in progress, what's blocked, and why decisions were made. No standup required to answer "wait, why did we use that library?".

**Open source projects** — contributors, human or AI, get full context before they touch anything. No more "I rewrote this without knowing it was tied to ADR-0005".

**Client work** — deliver the codebase and the reasoning behind it. The handoff document writes itself.

---

## Syncs with your existing tools

ADRKit lives in git. But if you use Linear or GitHub Issues, it syncs there too — delegating auth entirely to the CLIs you already have authenticated.

```bash
adrkit sync linear    # requires: linear CLI authenticated
adrkit sync github    # requires: gh auth login
```

---

## Install

```bash
npm install -g adrkit
```

```bash
cd your-project
adrkit init
# → .adrconfig created
# → git hooks installed
# → ready
```

---

## The spec

ADRKit is fully documented in the [Founding Paper](./docs/founding-paper-v0.5.md) — itself written as `ADR-0000` of the project. Every design decision is recorded in the format ADRKit enforces.

---

*Built by [@elydelva](https://github.com/elydelva). Early stage. Feedback welcome.*