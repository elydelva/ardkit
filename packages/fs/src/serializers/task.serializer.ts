import type { Task } from "@adrkit/core";
import { TaskId } from "@adrkit/core";
import { stringifyFrontmatter } from "../parsers/frontmatter.parser.js";

export function serializeTask(task: Task): string {
  const data: Record<string, unknown> = {
    id: task.id.toString(),
    adrId: task.adrId.toString(),
    title: task.title,
    status: task.status,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    startedAt: task.startedAt?.toISOString() ?? null,
    completedAt: task.completedAt?.toISOString() ?? null,
    author: task.author,
    assignee: task.assignee,
    estimatedHours: task.estimatedHours,
    gates: task.gates.map((g) => (g instanceof TaskId ? g.toString() : g)),
    rules: task.rules,
  };

  return stringifyFrontmatter(data, task.body);
}
