import { beforeEach, describe, expect, it } from "bun:test";
import { ADR } from "../entities/adr.js";
import { Task } from "../entities/task.js";
import type { Trace } from "../entities/trace.js";
import { GatesNotClearedError, InvalidTransitionError, TaskNotFoundError } from "../errors.js";
import type { IRealmRepository } from "../ports/realm.repository.js";
import { ADRId } from "../value-objects/adr-id.js";
import { TaskId } from "../value-objects/task-id.js";
import { TraceId } from "../value-objects/trace-id.js";
import { CompleteTaskUseCase } from "./complete-task.js";

function makeInMemoryRepo(): IRealmRepository & {
  adrs: Map<string, ADR>;
  tasks: Map<string, Task>;
  traces: Trace[];
  counters: Record<string, number>;
} {
  const adrs = new Map<string, ADR>();
  const tasks = new Map<string, Task>();
  const traces: Trace[] = [];
  const counters: Record<string, number> = { adr: 0, task: 0, trace: 0 };

  return {
    adrs,
    tasks,
    traces,
    counters,
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

describe("CompleteTaskUseCase", () => {
  let repo: ReturnType<typeof makeInMemoryRepo>;
  let useCase: CompleteTaskUseCase;

  beforeEach(() => {
    repo = makeInMemoryRepo();
    useCase = new CompleteTaskUseCase(repo);
  });

  it("completes a task in happy path", async () => {
    const adrId = ADRId.generate(1);
    const adr = ADR.create({ id: adrId, title: "Test ADR", author: "test" });
    repo.adrs.set(adrId.toString(), { ...adr, status: "accepted" });

    const taskId = TaskId.generate(1);
    const task = Task.create({ id: taskId, adrId, title: "Test Task", author: "test" });
    const inProgress: Task = { ...task, status: "in-progress" };
    repo.tasks.set(taskId.toString(), inProgress);

    const result = await useCase.execute({ id: taskId, actor: "test" });
    expect(result.status).toBe("completed");
    expect(result.completedAt).not.toBeNull();
  });

  it("throws TaskNotFoundError when task does not exist", async () => {
    expect(useCase.execute({ id: TaskId.generate(99), actor: "test" })).rejects.toThrow(
      TaskNotFoundError
    );
  });

  it("throws GatesNotClearedError when gates are not cleared", async () => {
    const adrId = ADRId.generate(1);
    const depId = TaskId.generate(1);
    const taskId = TaskId.generate(2);

    const dep = Task.create({ id: depId, adrId, title: "Dep", author: "test" });
    repo.tasks.set(depId.toString(), dep); // not-started

    const task = Task.create({ id: taskId, adrId, title: "Task", author: "test", gates: [depId] });
    const inProgress: Task = { ...task, status: "in-progress" };
    repo.tasks.set(taskId.toString(), inProgress);

    expect(useCase.execute({ id: taskId, actor: "test" })).rejects.toThrow(GatesNotClearedError);
  });

  it("throws InvalidTransitionError for invalid status transition", async () => {
    const adrId = ADRId.generate(1);
    const taskId = TaskId.generate(1);
    const task = Task.create({ id: taskId, adrId, title: "Task", author: "test" });
    // task is 'not-started' — can't go to 'completed' directly... wait,
    // actually not-started -> in-progress -> completed is valid, not-started -> completed is invalid
    repo.tasks.set(taskId.toString(), task);

    expect(useCase.execute({ id: taskId, actor: "test" })).rejects.toThrow(InvalidTransitionError);
  });
});
