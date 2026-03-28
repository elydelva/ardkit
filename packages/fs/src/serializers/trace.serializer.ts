import type { Trace } from "@adrkit/core";
import { stringifyFrontmatter } from "../parsers/frontmatter.parser.js";

export function serializeTrace(trace: Trace): string {
  const data: Record<string, unknown> = {
    id: trace.id.toString(),
    adrId: trace.adrId.toString(),
    taskId: trace.taskId?.toString() ?? null,
    at: trace.at.toISOString(),
    actor: trace.actor,
    actorType: trace.actorType,
    event: trace.event,
    ref: trace.ref,
    from: trace.from,
    to: trace.to,
  };

  return stringifyFrontmatter(data, trace.body);
}
