# adrkit

> *Git tracks what changed. ADRKit tracks why.*

Decision-first, agent-native project management system that lives inside your git repository.

## Install

```bash
npm install -g adrkit
```

## Quick start

```bash
cd your-project
adrkit init

adrkit new --title "Switch auth to JWT" --type tech-choice
adrkit context --active | pbcopy   # paste into your agent
adrkit next                         # what to work on next
```

## Documentation

Full documentation in the [GitHub repository](https://github.com/elydelva/adrkit).

## License

MIT
