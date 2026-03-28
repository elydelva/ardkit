import { describe, expect, it } from "bun:test";
import type { Trace, TraceFilter } from "@adrkit/core";
import { ADRId, TaskId, TraceId } from "@adrkit/core";
import { Trace as TraceFactory } from "@adrkit/core";
import type { IRealmRepository } from "@adrkit/core";
import { GetHistoryUseCase } from "./get-history.js";

function makeTrace(
  id: string,
  adrId: string,
  at: Date,
  overrides: Partial<Parameters<typeof TraceFactory.create>[0]> = {}
): Trace {
  return {
    ...TraceFactory.create({
      id: TraceId.from(id),
      adrId: ADRId.from(adrId),
      actor: "alice",
      actorType: "human",
      event: "adr_created",
      ...overrides,
    }),
    at,
  };
}

function makeRepo(traces: Trace[]): Pick<IRealmRepository, "findTraces"> {
  return {
    async findTraces(filter: TraceFilter) {
      let result = traces;
      const { adrId, actor, event, taskId, since } = filter;
      if (adrId) result = result.filter((t) => t.adrId.equals(adrId));
      if (actor) result = result.filter((t) => t.actor === actor);
      if (event) result = result.filter((t) => t.event === event);
      if (taskId) result = result.filter((t) => t.taskId?.equals(taskId) ?? false);
      if (since) result = result.filter((t) => t.at >= since);
      return result;
    },
  };
}

describe("GetHistoryUseCase", () => {
  it("returns empty array when no traces", async () => {
    const uc = new GetHistoryUseCase(makeRepo([]) as IRealmRepository);
    expect(await uc.execute()).toEqual([]);
  });

  it("returns traces sorted by date ascending", async () => {
    const t1 = makeTrace("TRACE-0001", "ADR-0001", new Date("2024-03-01"));
    const t2 = makeTrace("TRACE-0002", "ADR-0001", new Date("2024-01-01"));
    const t3 = makeTrace("TRACE-0003", "ADR-0001", new Date("2024-06-01"));

    const uc = new GetHistoryUseCase(makeRepo([t1, t2, t3]) as IRealmRepository);
    const result = await uc.execute();

    expect(result.map((t) => t.id.toString())).toEqual(["TRACE-0002", "TRACE-0001", "TRACE-0003"]);
  });

  it("does not mutate original array when sorting", async () => {
    const t1 = makeTrace("TRACE-0001", "ADR-0001", new Date("2024-03-01"));
    const t2 = makeTrace("TRACE-0002", "ADR-0001", new Date("2024-01-01"));
    const original = [t1, t2];

    const uc = new GetHistoryUseCase(makeRepo(original) as IRealmRepository);
    await uc.execute();

    expect(original[0]?.id.toString()).toBe("TRACE-0001");
  });

  it("passes adrId filter to repo", async () => {
    const adr1 = ADRId.from("ADR-0001");
    const adr2 = ADRId.from("ADR-0002");
    const t1 = makeTrace("TRACE-0001", "ADR-0001", new Date());
    const t2 = makeTrace("TRACE-0002", "ADR-0002", new Date());

    const uc = new GetHistoryUseCase(makeRepo([t1, t2]) as IRealmRepository);
    const result = await uc.execute({ adrId: adr1 });

    expect(result).toHaveLength(1);
    expect(result[0]?.adrId.toString()).toBe("ADR-0001");
  });

  it("passes actor filter to repo", async () => {
    const t1 = makeTrace("TRACE-0001", "ADR-0001", new Date(), { actor: "alice" });
    const t2 = makeTrace("TRACE-0002", "ADR-0001", new Date(), { actor: "bot" });

    const uc = new GetHistoryUseCase(makeRepo([t1, t2]) as IRealmRepository);
    const result = await uc.execute({ actor: "alice" });

    expect(result).toHaveLength(1);
    expect(result[0]?.actor).toBe("alice");
  });

  it("passes event filter to repo", async () => {
    const t1 = makeTrace("TRACE-0001", "ADR-0001", new Date(), { event: "adr_created" });
    const t2 = makeTrace("TRACE-0002", "ADR-0001", new Date(), { event: "task_completed" });

    const uc = new GetHistoryUseCase(makeRepo([t1, t2]) as IRealmRepository);
    const result = await uc.execute({ event: "task_completed" });

    expect(result).toHaveLength(1);
    expect(result[0]?.event).toBe("task_completed");
  });

  it("passes taskId filter to repo", async () => {
    const taskId = TaskId.from("TASK-0001");
    const t1 = makeTrace("TRACE-0001", "ADR-0001", new Date(), { taskId, event: "task_completed" });
    const t2 = makeTrace("TRACE-0002", "ADR-0001", new Date(), { event: "adr_created" });

    const uc = new GetHistoryUseCase(makeRepo([t1, t2]) as IRealmRepository);
    const result = await uc.execute({ taskId });

    expect(result).toHaveLength(1);
    expect(result[0]?.taskId?.toString()).toBe("TASK-0001");
  });

  it("passes since filter to repo", async () => {
    const since = new Date("2024-06-01");
    const t1 = makeTrace("TRACE-0001", "ADR-0001", new Date("2024-01-01"));
    const t2 = makeTrace("TRACE-0002", "ADR-0001", new Date("2024-09-01"));

    const uc = new GetHistoryUseCase(makeRepo([t1, t2]) as IRealmRepository);
    const result = await uc.execute({ since });

    expect(result).toHaveLength(1);
    expect(result[0]?.id.toString()).toBe("TRACE-0002");
  });

  it("returns single trace without error", async () => {
    const t1 = makeTrace("TRACE-0001", "ADR-0001", new Date("2024-01-01"));
    const uc = new GetHistoryUseCase(makeRepo([t1]) as IRealmRepository);
    const result = await uc.execute();
    expect(result).toHaveLength(1);
  });
});
