import { beforeEach, describe, expect, it } from "bun:test";
import { ADR, Task } from "../../entities/index.js";
import type { Trace } from "../../entities/index.js";
import type { IRealmRepository } from "../../ports/index.js";
import { ADRId, TaskId } from "../../value-objects/index.js";
import { GetNextUseCase } from "./get-next.js";

function makeInMemoryRepo(adrs: ADR[], tasks: Task[]): IRealmRepository {
  const adrMap = new Map(adrs.map((a) => [a.id.toString(), a]));
  const taskMap = new Map(tasks.map((t) => [t.id.toString(), t]));
  return {
    findADR: async (id) => adrMap.get(id.toString()) ?? null,
    findAllADRs: async () => adrs,
    saveADR: async (adr) => {
      adrMap.set(adr.id.toString(), adr);
    },
    findTask: async (id) => taskMap.get(id.toString()) ?? null,
    findTasksForADR: async (adrId) => tasks.filter((t) => t.adrId.equals(adrId)),
    findAllTasks: async () => tasks,
    saveTask: async (task) => {
      taskMap.set(task.id.toString(), task);
    },
    appendTrace: async () => {},
    findTraces: async () => [],
    getState: async () => ({ counters: { adr: 0, task: 0, trace: 0 } }),
    incrementCounter: async () => 1,
  };
}

describe("GetNextUseCase", () => {
  it("returns null when no eligible tasks", async () => {
    const repo = makeInMemoryRepo([], []);
    const uc = new GetNextUseCase(repo);
    expect(await uc.execute()).toBeNull();
  });

  it("returns task and adr for a single eligible task", async () => {
    const adrId = ADRId.generate(1);
    const adr: ADR = {
      ...ADR.create({ id: adrId, title: "ADR", author: "test" }),
      status: "accepted",
    };
    const taskId = TaskId.generate(1);
    const task = Task.create({ id: taskId, adrId, title: "Task", author: "test" });

    const repo = makeInMemoryRepo([adr], [task]);
    const uc = new GetNextUseCase(repo);
    const result = await uc.execute();
    expect(result).not.toBeNull();
    expect(result?.task.id.toString()).toBe("TASK-0001");
    expect(result?.adr.id.toString()).toBe("ADR-0001");
  });

  it("sorts by phase alphabetically", async () => {
    const adrId1 = ADRId.generate(1);
    const adrId2 = ADRId.generate(2);
    const baseTime = new Date("2024-01-01T00:00:00Z");

    const adr1: ADR = {
      ...ADR.create({ id: adrId1, title: "ADR1", author: "test", phase: "z-phase" }),
      status: "accepted",
      createdAt: baseTime,
    };
    const adr2: ADR = {
      ...ADR.create({ id: adrId2, title: "ADR2", author: "test", phase: "a-phase" }),
      status: "accepted",
      createdAt: baseTime,
    };

    const task1 = Task.create({
      id: TaskId.generate(1),
      adrId: adrId1,
      title: "T1",
      author: "test",
    });
    const task2 = Task.create({
      id: TaskId.generate(2),
      adrId: adrId2,
      title: "T2",
      author: "test",
    });

    const repo = makeInMemoryRepo([adr1, adr2], [task1, task2]);
    const uc = new GetNextUseCase(repo);
    const result = await uc.execute();
    // a-phase comes before z-phase
    expect(result?.adr.id.toString()).toBe("ADR-0002");
  });

  it("returns null when all tasks are completed", async () => {
    const adrId = ADRId.generate(1);
    const adr: ADR = {
      ...ADR.create({ id: adrId, title: "ADR", author: "test" }),
      status: "accepted",
    };
    const taskId = TaskId.generate(1);
    const task: Task = {
      ...Task.create({ id: taskId, adrId, title: "Task", author: "test" }),
      status: "completed",
    };

    const repo = makeInMemoryRepo([adr], [task]);
    const uc = new GetNextUseCase(repo);
    expect(await uc.execute()).toBeNull();
  });
});
