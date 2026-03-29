import type { Trace } from "@adrkit/core";
import { ADRId, TaskId } from "@adrkit/core";
import type { Container } from "../container.js";

interface HistoryOptions {
  adr?: string;
  actor?: string;
  event?: string;
  task?: string;
  since?: string;
  json?: boolean;
}

function formatTrace(trace: Trace): string {
  const at = trace.at.toISOString().replace("T", " ").slice(0, 19);
  const task = trace.taskId ? ` [${trace.taskId.toString()}]` : "";
  const transition = trace.from && trace.to ? ` (${trace.from} → ${trace.to})` : "";
  const ref = trace.ref ? ` ref:${trace.ref}` : "";
  return `${at}  ${trace.event.padEnd(22)}  ${trace.actor}${task}${transition}${ref}`;
}

export async function runHistory(container: Container, opts: HistoryOptions): Promise<void> {
  const filter: Parameters<typeof container.getHistory.execute>[0] = {};

  if (opts.adr) filter.adrId = ADRId.from(opts.adr);
  if (opts.actor) filter.actor = opts.actor;
  if (opts.event) {
    // validated by type at runtime — unknown events return no results (trace parser defaults to "note")
    filter.event = opts.event as NonNullable<typeof filter.event>;
  }
  if (opts.task) filter.taskId = TaskId.from(opts.task);
  if (opts.since) {
    const d = new Date(opts.since);
    if (Number.isNaN(d.getTime())) {
      console.error(`Invalid date: ${opts.since}`);
      process.exit(1);
    }
    filter.since = d;
  }

  const traces = await container.getHistory.execute(filter);

  if (opts.json) {
    console.log(
      JSON.stringify(
        traces.map((t) => ({
          id: t.id.toString(),
          adrId: t.adrId.toString(),
          taskId: t.taskId?.toString() ?? null,
          at: t.at.toISOString(),
          actor: t.actor,
          actorType: t.actorType,
          event: t.event,
          ref: t.ref,
          from: t.from,
          to: t.to,
          body: t.body,
        })),
        null,
        2
      )
    );
    return;
  }

  if (traces.length === 0) {
    console.log("No history found.");
    return;
  }

  for (const trace of traces) {
    console.log(formatTrace(trace));
  }
}
