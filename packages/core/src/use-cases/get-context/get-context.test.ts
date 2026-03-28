import { beforeEach, describe, expect, it } from "bun:test";
import { ADR, Task } from "../../entities/index.js";
import type { Trace } from "../../entities/index.js";
import type { IRealmRepository } from "../../ports/index.js";
import { ADRId, TaskId } from "../../value-objects/index.js";
import { GetContextUseCase } from "./get-context.js";

function makeInMemoryRepo(): IRealmRepository {
  const adrs = new Map<string, ADR>();
  const tasks = new Map<string, Task>();
  const traces: Trace[] = [];
  const counters: Record<string, number> = { adr: 0, task: 0, trace: 0 };

  return {
    findADR: async (id) => adrs.get(id.toString()) ?? null,
    findAllADRs: async () => [...adrs.values()],
    saveADR: async (adr) => {
      adrs.set(adr.id.toString(), adr);
    },
    findTask: async (id) => tasks.get(id.toString()) ?? null,
    findTasksForADR: async (adrId) => [...tasks.values()].filter((t) => t.adrId.equals(adrId)),
    findAllTasks: async () => [...tasks.values()],
    saveTask: async (task) => {
      tasks.set(task.id.toString(), task);
    },
    appendTrace: async (trace) => {
      traces.push(trace);
    },
    findTraces: async () => [...traces],
    getState: async () => ({
      counters: { adr: counters.adr ?? 0, task: counters.task ?? 0, trace: counters.trace ?? 0 },
    }),
    incrementCounter: async (key) => {
      counters[key] = (counters[key] ?? 0) + 1;
      return counters[key] ?? 1;
    },
  };
}

describe("GetContextUseCase", () => {
  let repo: IRealmRepository;
  let useCase: GetContextUseCase;
  const adrId1 = ADRId.generate(1);
  const adrId2 = ADRId.generate(2);

  beforeEach(async () => {
    repo = makeInMemoryRepo();
    useCase = new GetContextUseCase(repo);

    await repo.saveADR({
      ...ADR.create({ id: adrId1, title: "ADR 1", author: "alice" }),
      status: "accepted",
    });
    await repo.saveADR({
      ...ADR.create({ id: adrId2, title: "ADR 2", author: "alice" }),
      status: "abandoned",
    });
    await repo.saveTask(
      Task.create({ id: TaskId.generate(1), adrId: adrId1, title: "Task 1", author: "alice" })
    );
  });

  it("returns all ADRs and their tasks with no filter", async () => {
    const ctx = await useCase.execute();
    expect(ctx.adrs).toHaveLength(2);
    expect(ctx.tasks).toHaveLength(1);
  });

  it("scopes to a single ADR when adrId filter is provided", async () => {
    const ctx = await useCase.execute({ adrId: adrId1 });
    expect(ctx.adrs).toHaveLength(1);
    expect(ctx.adrs[0]?.id.equals(adrId1)).toBe(true);
    expect(ctx.tasks).toHaveLength(1);
  });

  it("filters to active ADRs when activeOnly is true", async () => {
    const ctx = await useCase.execute({ activeOnly: true });
    // adrId1 is 'accepted' (active), adrId2 is 'abandoned' (not active)
    expect(ctx.adrs).toHaveLength(1);
    expect(ctx.adrs[0]?.id.equals(adrId1)).toBe(true);
  });

  it("returns empty context when no ADRs match adrId filter", async () => {
    const ctx = await useCase.execute({ adrId: ADRId.generate(99) });
    expect(ctx.adrs).toHaveLength(0);
    expect(ctx.tasks).toHaveLength(0);
  });
});
