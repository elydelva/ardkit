import { beforeEach, describe, expect, it } from "bun:test";
import { ADR } from "../../entities/index.js";
import type { Task, Trace } from "../../entities/index.js";
import { ADRNotFoundError } from "../../errors/index.js";
import type { IRealmRepository } from "../../ports/index.js";
import { ADRId } from "../../value-objects/index.js";
import { CreateTaskUseCase } from "./create-task.js";

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

describe("CreateTaskUseCase", () => {
  let repo: IRealmRepository;
  let useCase: CreateTaskUseCase;
  const adrId = ADRId.generate(1);

  beforeEach(() => {
    repo = makeInMemoryRepo();
    useCase = new CreateTaskUseCase(repo);
  });

  it("throws ADRNotFoundError when ADR does not exist", async () => {
    await expect(useCase.execute({ adrId, title: "Task", author: "alice" })).rejects.toBeInstanceOf(
      ADRNotFoundError
    );
  });

  it("creates and persists a task under an existing ADR", async () => {
    const adr = ADR.create({ id: adrId, title: "My ADR", author: "alice" });
    await repo.saveADR(adr);

    const task = await useCase.execute({ adrId, title: "First task", author: "alice" });
    expect(task.id.toString()).toBe("TASK-0001");
    expect(task.adrId.equals(adrId)).toBe(true);
    expect(task.status).toBe("not-started");
  });

  it("appends a trace on creation", async () => {
    const adr = ADR.create({ id: adrId, title: "My ADR", author: "alice" });
    await repo.saveADR(adr);
    await useCase.execute({ adrId, title: "Traced task", author: "alice" });

    const traces = await repo.findTraces({});
    expect(traces).toHaveLength(1);
    expect(traces[0]?.event).toBe("task_created");
  });

  it("calls git.stage when git adapter is provided", async () => {
    const adr = ADR.create({ id: adrId, title: "My ADR", author: "alice" });
    await repo.saveADR(adr);

    const staged: string[][] = [];
    const git = {
      stage: async (p: string[]) => {
        staged.push(p);
      },
      isRepo: async () => true,
    };
    const useCaseWithGit = new CreateTaskUseCase(repo, git);
    await useCaseWithGit.execute({ adrId, title: "Git task", author: "alice" });
    expect(staged).toHaveLength(1);
  });
});
