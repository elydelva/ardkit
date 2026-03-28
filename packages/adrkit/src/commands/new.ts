import * as readline from "node:readline/promises";
import { ADRId } from "@adrkit/core";
import type { Container } from "../container.js";

interface NewOptions {
  title?: string;
  type?: string;
  phase?: string;
  tags?: string[];
}

async function prompt(rl: readline.Interface, question: string): Promise<string> {
  const answer = await rl.question(question);
  return answer.trim();
}

export async function runNew(container: Container, opts: NewOptions): Promise<void> {
  let { title, type, phase, tags } = opts;

  if (!title || !type) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    try {
      if (!title) {
        title = await prompt(rl, "Title: ");
      }
      if (!type) {
        type = await prompt(rl, "Type (tech-choice/process/architecture) [tech-choice]: ");
        if (!type) type = "tech-choice";
      }
      if (!phase) {
        phase = await prompt(rl, "Phase (optional): ");
      }
    } finally {
      rl.close();
    }
  }

  if (!title) {
    console.error("Error: title is required");
    process.exit(1);
  }

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const author = process.env.GIT_AUTHOR_NAME ?? process.env.USER ?? "unknown";

  const adr = await container.createADR.execute({
    title,
    author,
    phase: phase ?? "",
    tags: tags ?? [],
    body: "## Context\n\n<!-- Why does this decision need to be made? -->\n\n## Decision\n\n<!-- What was decided? -->\n\n## Consequences\n\n<!-- What are the trade-offs? -->\n",
  });

  console.log(`✓ Created ${adr.id.toString()} — ${adr.title}`);
  console.log(`  .adrkit/${adr.id.toString()}/`);
}
