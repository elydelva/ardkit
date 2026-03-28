import type { Rule, Task } from "@adrkit/core";
import { type ADRId, TaskId } from "@adrkit/core";
import type { TaskStatus } from "@adrkit/core";
import { parseFrontmatter } from "./frontmatter.parser.js";

function toTaskStatus(val: unknown): TaskStatus {
  const valid: TaskStatus[] = [
    "not-started",
    "in-progress",
    "completed",
    "abandoned",
    "blocked",
    "skipped",
  ];
  if (typeof val === "string" && valid.includes(val as TaskStatus)) {
    return val as TaskStatus;
  }
  return "not-started";
}

function toDate(val: unknown): Date {
  if (val instanceof Date) return val;
  if (typeof val === "string" || typeof val === "number") {
    const d = new Date(val);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

function toDateOrNull(val: unknown): Date | null {
  if (val === null || val === undefined) return null;
  return toDate(val);
}

function toRuleArray(val: unknown): Rule[] {
  if (!Array.isArray(val)) return [];
  return val.filter(
    (v): v is Rule =>
      typeof v === "object" &&
      v !== null &&
      typeof (v as Record<string, unknown>).trigger === "string" &&
      typeof (v as Record<string, unknown>).instruction === "string"
  );
}

function toGates(val: unknown): Array<TaskId | string> {
  if (!Array.isArray(val)) return [];
  const result: Array<TaskId | string> = [];
  for (const v of val) {
    if (typeof v !== "string") continue;
    if (/^TASK-\d{4}$/.test(v)) {
      try {
        result.push(TaskId.from(v));
        continue;
      } catch {
        // fall through to string push
      }
    }
    result.push(v);
  }
  return result;
}

export function parseTask(content: string, adrId: ADRId): Task {
  const { data, body } = parseFrontmatter(content);

  const id = TaskId.from(String(data.id ?? ""));
  const title = typeof data.title === "string" ? data.title : "";
  const status = toTaskStatus(data.status);
  const createdAt = toDate(data.createdAt);
  const updatedAt = toDate(data.updatedAt);
  const startedAt = toDateOrNull(data.startedAt ?? null);
  const completedAt = toDateOrNull(data.completedAt ?? null);
  const author = typeof data.author === "string" ? data.author : "";
  const assignee = typeof data.assignee === "string" ? data.assignee : null;
  const estimatedHours = typeof data.estimatedHours === "number" ? data.estimatedHours : null;
  const gates = toGates(data.gates);
  const rules = toRuleArray(data.rules);

  return {
    id,
    adrId,
    title,
    status,
    createdAt,
    updatedAt,
    startedAt,
    completedAt,
    author,
    assignee,
    estimatedHours,
    gates,
    rules,
    body,
  };
}
