import type { Trace, TraceEvent } from "@adrkit/core";
import { ADRId, TaskId, TraceId } from "@adrkit/core";
import { parseFrontmatter } from "./frontmatter.parser.js";

function toTraceEvent(val: unknown): TraceEvent {
  const valid: TraceEvent[] = [
    "adr_created",
    "adr_status_changed",
    "task_created",
    "task_started",
    "task_completed",
    "task_abandoned",
    "rules_acknowledged",
    "note",
    "synced",
  ];
  if (typeof val === "string" && valid.includes(val as TraceEvent)) {
    return val as TraceEvent;
  }
  return "note";
}

function toDate(val: unknown): Date {
  if (val instanceof Date) return val;
  if (typeof val === "string" || typeof val === "number") {
    const d = new Date(val);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

function toActorType(val: unknown): "human" | "agent" {
  if (val === "agent") return "agent";
  return "human";
}

function toStringOrNull(val: unknown): string | null {
  if (typeof val === "string" && val.length > 0) return val;
  return null;
}

function toTaskIdOrNull(val: unknown): TaskId | null {
  if (typeof val !== "string" || val.length === 0) return null;
  try {
    return TaskId.from(val);
  } catch {
    return null;
  }
}

export function parseTrace(content: string, adrId: ADRId): Trace {
  const { data, body } = parseFrontmatter(content);

  const id = TraceId.from(String(data.id ?? ""));
  const parsedAdrId = (() => {
    try {
      return ADRId.from(String(data.adrId ?? ""));
    } catch {
      return adrId;
    }
  })();

  return {
    id,
    adrId: parsedAdrId,
    taskId: toTaskIdOrNull(data.taskId),
    at: toDate(data.at),
    actor: typeof data.actor === "string" ? data.actor : "unknown",
    actorType: toActorType(data.actorType),
    event: toTraceEvent(data.event),
    ref: toStringOrNull(data.ref),
    from: toStringOrNull(data.from),
    to: toStringOrNull(data.to),
    body,
  };
}
