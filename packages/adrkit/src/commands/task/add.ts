import { ADRId } from "@adrkit/core";
import type { Container } from "../../container.js";

interface TaskAddOptions {
  title: string;
  type?: string;
  gates?: string[];
}

export async function runTaskAdd(
  container: Container,
  adrIdRaw: string,
  opts: TaskAddOptions
): Promise<void> {
  const adrId = ADRId.from(adrIdRaw);
  const author = process.env.GIT_AUTHOR_NAME ?? process.env.USER ?? "unknown";

  const task = await container.createTask.execute({
    adrId,
    title: opts.title,
    author,
    gates: opts.gates ?? [],
  });

  console.log(`✓ Created ${task.id.toString()} — ${task.title}`);
  console.log(`  ADR: ${adrId.toString()}`);
}
