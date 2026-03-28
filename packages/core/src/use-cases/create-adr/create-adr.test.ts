import { beforeEach, describe, expect, it } from "bun:test";
import type { ADR, Task, Trace } from "../../entities/index.js";
import type { IRealmRepository } from "../../ports/index.js";
import { CreateADRUseCase } from "./create-adr.js";

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

describe("CreateADRUseCase", () => {
  let repo: IRealmRepository;
  let useCase: CreateADRUseCase;

  beforeEach(() => {
    repo = makeInMemoryRepo();
    useCase = new CreateADRUseCase(repo);
  });

  it("creates and persists an ADR with an incremented id", async () => {
    const adr = await useCase.execute({ title: "Test ADR", author: "alice" });
    expect(adr.id.toString()).toBe("ADR-0001");
    expect(adr.title).toBe("Test ADR");
    expect(adr.status).toBe("draft");
  });

  it("increments id for each subsequent ADR", async () => {
    await useCase.execute({ title: "First", author: "alice" });
    const second = await useCase.execute({ title: "Second", author: "alice" });
    expect(second.id.toString()).toBe("ADR-0002");
  });

  it("appends a trace on creation", async () => {
    await useCase.execute({ title: "Traced ADR", author: "alice" });
    const traces = await repo.findTraces({});
    expect(traces).toHaveLength(1);
    expect(traces[0]?.event).toBe("adr_created");
  });

  it("calls git.stage when git adapter is provided", async () => {
    const staged: string[][] = [];
    const git = {
      stage: async (p: string[]) => {
        staged.push(p);
      },
      isRepo: async () => true,
    };
    const useCaseWithGit = new CreateADRUseCase(repo, git);
    await useCaseWithGit.execute({ title: "Git ADR", author: "alice" });
    expect(staged).toHaveLength(1);
  });
});
