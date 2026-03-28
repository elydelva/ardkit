import type { Container } from "../container.js";

interface NextOptions {
  json?: boolean;
}

export async function runNext(container: Container, opts: NextOptions): Promise<void> {
  const result = await container.getNext.execute();

  if (!result) {
    if (opts.json) {
      console.log(JSON.stringify(null));
    } else {
      console.log("No tasks available.");
    }
    return;
  }

  if (opts.json) {
    console.log(
      JSON.stringify({
        task: {
          id: result.task.id.toString(),
          adrId: result.task.adrId.toString(),
          title: result.task.title,
          status: result.task.status,
          gates: result.task.gates.map((g) => (typeof g === "string" ? g : g.toString())),
        },
        adr: {
          id: result.adr.id.toString(),
          title: result.adr.title,
          phase: result.adr.phase,
          status: result.adr.status,
        },
      })
    );
    return;
  }

  console.log(`${result.task.id.toString()} — ${result.task.title}`);
  console.log(`  ADR: ${result.adr.id.toString()} — ${result.adr.title}`);
  if (result.adr.phase) {
    console.log(`  Phase: ${result.adr.phase}`);
  }
}
