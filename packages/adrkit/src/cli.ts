import * as path from "node:path";
import { Command } from "commander";
import { runContext } from "./commands/context.js";
import { runHistory } from "./commands/history.js";
import { runInit } from "./commands/init.js";
import { runNew } from "./commands/new.js";
import { runNext } from "./commands/next.js";
import { runTaskAdd } from "./commands/task/add.js";
import { runTaskComplete } from "./commands/task/complete.js";
import { runTaskStart } from "./commands/task/start.js";
import { createContainer } from "./container.js";

function getRealmRoot(): string {
  return process.env.ADRKIT_ROOT ?? process.cwd();
}

export function buildCLI(): Command {
  const program = new Command();

  program
    .name("adrkit")
    .description("Decision-first, agent-native project management for git repositories")
    .version("0.1.0");

  program
    .command("init")
    .description("Initialize ADRKit in the current repository")
    .action(async () => {
      await runInit(getRealmRoot());
    });

  program
    .command("new")
    .description("Create a new ADR")
    .option("--title <title>", "ADR title")
    .option("--type <type>", "ADR type (tech-choice, process, architecture)")
    .option("--phase <phase>", "Optional phase")
    .option("--tags <tags...>", "Tags")
    .action(async (opts: { title?: string; type?: string; phase?: string; tags?: string[] }) => {
      const container = createContainer(getRealmRoot());
      await runNew(container, opts);
    });

  program
    .command("context")
    .description("Dump realm context as JSON")
    .option("--adr <id>", "Scope to a specific ADR (e.g. ADR-0001)")
    .option("--active", "Filter to in-progress / active ADRs only")
    .option("--json", "Output as JSON (default)")
    .action(async (opts: { adr?: string; active?: boolean; json?: boolean }) => {
      const container = createContainer(getRealmRoot());
      await runContext(container, opts);
    });

  program
    .command("next")
    .description("Get the next task to work on")
    .option("--json", "Machine-readable output")
    .action(async (opts: { json?: boolean }) => {
      const container = createContainer(getRealmRoot());
      await runNext(container, opts);
    });

  program
    .command("history")
    .description("Show audit trail of events")
    .option("--adr <id>", "Scope to a specific ADR (e.g. ADR-0001)")
    .option("--task <id>", "Scope to a specific task (e.g. TASK-0001)")
    .option("--actor <name>", "Filter by actor")
    .option("--event <event>", "Filter by event type")
    .option("--since <date>", "Filter events after this date (ISO 8601)")
    .option("--json", "Machine-readable output")
    .action(
      async (opts: {
        adr?: string;
        task?: string;
        actor?: string;
        event?: string;
        since?: string;
        json?: boolean;
      }) => {
        const container = createContainer(getRealmRoot());
        await runHistory(container, opts);
      }
    );

  const task = program.command("task").description("Manage tasks");

  task
    .command("add <adrId>")
    .description("Add a task to an ADR")
    .requiredOption("--title <title>", "Task title")
    .option("--gates <gates...>", "Task IDs that must complete first")
    .action(async (adrId: string, opts: { title: string; gates?: string[] }) => {
      const container = createContainer(getRealmRoot());
      await runTaskAdd(container, adrId, opts);
    });

  task
    .command("start <taskId>")
    .description("Mark a task as in-progress")
    .action(async (taskId: string) => {
      const container = createContainer(getRealmRoot());
      await runTaskStart(container, taskId);
    });

  task
    .command("complete <taskId>")
    .description("Mark a task as completed")
    .action(async (taskId: string) => {
      const container = createContainer(getRealmRoot());
      await runTaskComplete(container, taskId);
    });

  return program;
}
