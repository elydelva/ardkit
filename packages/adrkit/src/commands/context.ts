import { ADRId } from "@adrkit/core";
import type { Container } from "../container.js";

interface ContextOptions {
  adr?: string;
  active?: boolean;
  json?: boolean;
}

export async function runContext(container: Container, opts: ContextOptions): Promise<void> {
  const filter: { adrId?: ADRId; activeOnly?: boolean } = {};
  if (opts.adr) filter.adrId = ADRId.from(opts.adr);
  if (opts.active) filter.activeOnly = opts.active;

  const ctx = await container.getContext.execute(filter);

  const output = {
    adrs: ctx.adrs.map((a) => ({
      id: a.id.toString(),
      title: a.title,
      status: a.status,
      phase: a.phase,
      author: a.author,
      tags: a.tags,
      dependsOn: a.dependsOn.map((d) => d.toString()),
      relatedTo: a.relatedTo.map((r) => r.toString()),
      conflictsWith: a.conflictsWith.map((c) => c.toString()),
      rules: a.rules,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    })),
    tasks: ctx.tasks.map((t) => ({
      id: t.id.toString(),
      adrId: t.adrId.toString(),
      title: t.title,
      status: t.status,
      author: t.author,
      assignee: t.assignee,
      gates: t.gates.map((g) => (typeof g === "string" ? g : g.toString())),
      rules: t.rules,
      createdAt: t.createdAt.toISOString(),
    })),
    traces: ctx.traces.map((tr) => ({
      id: tr.id.toString(),
      adrId: tr.adrId.toString(),
      taskId: tr.taskId?.toString() ?? null,
      event: tr.event,
      actor: tr.actor,
      actorType: tr.actorType,
      timestamp: tr.at.toISOString(),
    })),
  };

  if (opts.json) {
    console.log(JSON.stringify(output, null, 2));
    return;
  }

  console.log(JSON.stringify(output, null, 2));
}
