import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { ADR, ADRId, Task, TaskId, Trace, TraceId } from "@adrkit/core";
import { FsRealmRepository } from "./realm.repository.js";

async function mkTempDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "adrkit-test-"));
}

describe("FsRealmRepository", () => {
  let tempDir: string;
  let repo: FsRealmRepository;

  beforeEach(async () => {
    tempDir = await mkTempDir();
    repo = new FsRealmRepository(tempDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe("ADR CRUD", () => {
    it("returns null for non-existent ADR", async () => {
      const result = await repo.findADR(ADRId.from("ADR-0001"));
      expect(result).toBeNull();
    });

    it("saves and retrieves an ADR", async () => {
      const adr = ADR.create({
        id: ADRId.from("ADR-0001"),
        title: "Test ADR",
        author: "alice",
      });
      await repo.saveADR(adr);
      const found = await repo.findADR(adr.id);
      expect(found).not.toBeNull();
      expect(found?.id.toString()).toBe("ADR-0001");
      expect(found?.title).toBe("Test ADR");
    });

    it("findAllADRs returns empty when no ADRs exist", async () => {
      const adrs = await repo.findAllADRs();
      expect(adrs).toHaveLength(0);
    });

    it("findAllADRs returns all saved ADRs", async () => {
      await repo.saveADR(
        ADR.create({ id: ADRId.from("ADR-0001"), title: "First", author: "alice" })
      );
      await repo.saveADR(
        ADR.create({ id: ADRId.from("ADR-0002"), title: "Second", author: "bob" })
      );
      const adrs = await repo.findAllADRs();
      expect(adrs).toHaveLength(2);
    });
  });

  describe("Task CRUD", () => {
    it("returns null for non-existent task", async () => {
      // need an ADR first so dir exists — but findTask scans all ADRs
      const result = await repo.findTask(TaskId.from("TASK-0001"));
      expect(result).toBeNull();
    });

    it("saves and retrieves a task", async () => {
      const adr = ADR.create({ id: ADRId.from("ADR-0001"), title: "ADR", author: "alice" });
      await repo.saveADR(adr);
      const task = Task.create({
        id: TaskId.from("TASK-0001"),
        adrId: adr.id,
        title: "Do something",
        author: "alice",
      });
      await repo.saveTask(task);
      const found = await repo.findTask(task.id);
      expect(found).not.toBeNull();
      expect(found?.id.toString()).toBe("TASK-0001");
      expect(found?.title).toBe("Do something");
    });

    it("findTasksForADR returns tasks for that ADR", async () => {
      const adrId = ADRId.from("ADR-0001");
      const adr = ADR.create({ id: adrId, title: "ADR", author: "alice" });
      await repo.saveADR(adr);
      await repo.saveTask(
        Task.create({ id: TaskId.from("TASK-0001"), adrId, title: "T1", author: "alice" })
      );
      await repo.saveTask(
        Task.create({ id: TaskId.from("TASK-0002"), adrId, title: "T2", author: "alice" })
      );
      const tasks = await repo.findTasksForADR(adrId);
      expect(tasks).toHaveLength(2);
    });
  });

  describe("counters", () => {
    it("increments counter and returns new value", async () => {
      const v1 = await repo.incrementCounter("adr");
      const v2 = await repo.incrementCounter("adr");
      expect(v1).toBe(1);
      expect(v2).toBe(2);
    });

    it("getState returns current counters", async () => {
      await repo.incrementCounter("adr");
      await repo.incrementCounter("task");
      await repo.incrementCounter("task");
      const state = await repo.getState();
      expect(state.counters.adr).toBe(1);
      expect(state.counters.task).toBe(2);
      expect(state.counters.trace).toBe(0);
    });
  });

  describe("traces", () => {
    it("appendTrace writes the file", async () => {
      const adrId = ADRId.from("ADR-0001");
      const adr = ADR.create({ id: adrId, title: "ADR", author: "alice" });
      await repo.saveADR(adr);
      const trace = Trace.create({
        id: TraceId.from("TRACE-0001"),
        adrId,
        actor: "alice",
        actorType: "human",
        event: "adr_created",
      });
      await repo.appendTrace(trace);
      const tracePath = path.join(tempDir, ".adrkit", "ADR-0001", "traces", "TRACE-0001.md");
      const exists = await fs
        .access(tracePath)
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);
    });

    it("findTraces returns empty when no ADRs exist", async () => {
      const traces = await repo.findTraces({});
      expect(traces).toEqual([]);
    });

    it("findTraces returns all traces across all ADRs", async () => {
      const adr1 = ADR.create({ id: ADRId.from("ADR-0001"), title: "A1", author: "alice" });
      const adr2 = ADR.create({ id: ADRId.from("ADR-0002"), title: "A2", author: "bob" });
      await repo.saveADR(adr1);
      await repo.saveADR(adr2);

      await repo.appendTrace(
        Trace.create({
          id: TraceId.from("TRACE-0001"),
          adrId: adr1.id,
          actor: "alice",
          actorType: "human",
          event: "adr_created",
        })
      );
      await repo.appendTrace(
        Trace.create({
          id: TraceId.from("TRACE-0002"),
          adrId: adr2.id,
          actor: "bob",
          actorType: "human",
          event: "adr_created",
        })
      );

      const traces = await repo.findTraces({});
      expect(traces).toHaveLength(2);
    });

    it("findTraces scoped to an ADR only returns that ADR's traces", async () => {
      const adr1 = ADR.create({ id: ADRId.from("ADR-0001"), title: "A1", author: "alice" });
      const adr2 = ADR.create({ id: ADRId.from("ADR-0002"), title: "A2", author: "bob" });
      await repo.saveADR(adr1);
      await repo.saveADR(adr2);

      await repo.appendTrace(
        Trace.create({
          id: TraceId.from("TRACE-0001"),
          adrId: adr1.id,
          actor: "alice",
          actorType: "human",
          event: "adr_created",
        })
      );
      await repo.appendTrace(
        Trace.create({
          id: TraceId.from("TRACE-0002"),
          adrId: adr2.id,
          actor: "bob",
          actorType: "human",
          event: "adr_created",
        })
      );

      const traces = await repo.findTraces({ adrId: adr1.id });
      expect(traces).toHaveLength(1);
      expect(traces[0]?.adrId.toString()).toBe("ADR-0001");
    });

    it("findTraces filters by actor", async () => {
      const adrId = ADRId.from("ADR-0001");
      const adr = ADR.create({ id: adrId, title: "A", author: "alice" });
      await repo.saveADR(adr);

      await repo.appendTrace(
        Trace.create({
          id: TraceId.from("TRACE-0001"),
          adrId,
          actor: "alice",
          actorType: "human",
          event: "adr_created",
        })
      );
      await repo.appendTrace(
        Trace.create({
          id: TraceId.from("TRACE-0002"),
          adrId,
          actor: "bot",
          actorType: "agent",
          event: "task_created",
        })
      );

      const traces = await repo.findTraces({ actor: "alice" });
      expect(traces).toHaveLength(1);
      expect(traces[0]?.actor).toBe("alice");
    });

    it("findTraces filters by event", async () => {
      const adrId = ADRId.from("ADR-0001");
      const adr = ADR.create({ id: adrId, title: "A", author: "alice" });
      await repo.saveADR(adr);

      await repo.appendTrace(
        Trace.create({
          id: TraceId.from("TRACE-0001"),
          adrId,
          actor: "alice",
          actorType: "human",
          event: "adr_created",
        })
      );
      await repo.appendTrace(
        Trace.create({
          id: TraceId.from("TRACE-0002"),
          adrId,
          actor: "alice",
          actorType: "human",
          event: "task_completed",
        })
      );

      const traces = await repo.findTraces({ event: "task_completed" });
      expect(traces).toHaveLength(1);
      expect(traces[0]?.event).toBe("task_completed");
    });

    it("findTraces filters by taskId", async () => {
      const adrId = ADRId.from("ADR-0001");
      const adr = ADR.create({ id: adrId, title: "A", author: "alice" });
      const taskId = TaskId.from("TASK-0001");
      await repo.saveADR(adr);

      await repo.appendTrace(
        Trace.create({
          id: TraceId.from("TRACE-0001"),
          adrId,
          actor: "alice",
          actorType: "human",
          event: "adr_created",
        })
      );
      await repo.appendTrace(
        Trace.create({
          id: TraceId.from("TRACE-0002"),
          adrId,
          taskId,
          actor: "alice",
          actorType: "human",
          event: "task_completed",
        })
      );

      const traces = await repo.findTraces({ taskId });
      expect(traces).toHaveLength(1);
      expect(traces[0]?.taskId?.toString()).toBe("TASK-0001");
    });

    it("findTraces filters by since", async () => {
      const adrId = ADRId.from("ADR-0001");
      const adr = ADR.create({ id: adrId, title: "A", author: "alice" });
      await repo.saveADR(adr);

      const past = Trace.create({
        id: TraceId.from("TRACE-0001"),
        adrId,
        actor: "alice",
        actorType: "human",
        event: "adr_created",
      });
      // Manually set an older timestamp by writing the file directly
      const tracesDir = path.join(tempDir, ".adrkit", "ADR-0001", "traces");
      await fs.mkdir(tracesDir, { recursive: true });
      const oldContent = `---\nid: TRACE-0001\nadrId: ADR-0001\ntaskId: null\nat: '2020-01-01T00:00:00.000Z'\nactor: alice\nactorType: human\nevent: adr_created\nref: null\nfrom: null\nto: null\n---\n`;
      await fs.writeFile(path.join(tracesDir, "TRACE-0001.md"), oldContent, "utf-8");
      await repo.appendTrace(
        Trace.create({
          id: TraceId.from("TRACE-0002"),
          adrId,
          actor: "alice",
          actorType: "human",
          event: "task_created",
        })
      );

      const since = new Date("2023-01-01");
      const traces = await repo.findTraces({ since });
      expect(traces).toHaveLength(1);
      expect(traces[0]?.id.toString()).toBe("TRACE-0002");
    });

    it("findTraces skips non-.md files in traces dir", async () => {
      const adrId = ADRId.from("ADR-0001");
      const adr = ADR.create({ id: adrId, title: "A", author: "alice" });
      await repo.saveADR(adr);
      await repo.appendTrace(
        Trace.create({
          id: TraceId.from("TRACE-0001"),
          adrId,
          actor: "alice",
          actorType: "human",
          event: "adr_created",
        })
      );
      // Write a non-.md file in traces dir
      const tracesDir = path.join(tempDir, ".adrkit", "ADR-0001", "traces");
      await fs.writeFile(path.join(tracesDir, ".DS_Store"), "junk", "utf-8");

      const traces = await repo.findTraces({});
      expect(traces).toHaveLength(1);
    });

    it("findTraces skips malformed trace files", async () => {
      const adrId = ADRId.from("ADR-0001");
      const adr = ADR.create({ id: adrId, title: "A", author: "alice" });
      await repo.saveADR(adr);

      const tracesDir = path.join(tempDir, ".adrkit", "ADR-0001", "traces");
      await fs.mkdir(tracesDir, { recursive: true });
      await fs.writeFile(path.join(tracesDir, "TRACE-0001.md"), "---\nid: BAD_ID\n---\n", "utf-8");
      await repo.appendTrace(
        Trace.create({
          id: TraceId.from("TRACE-0002"),
          adrId,
          actor: "alice",
          actorType: "human",
          event: "task_created",
        })
      );

      const traces = await repo.findTraces({});
      expect(traces).toHaveLength(1);
      expect(traces[0]?.id.toString()).toBe("TRACE-0002");
    });

    it("findTraces returns empty when adrId filter matches no ADR", async () => {
      const traces = await repo.findTraces({ adrId: ADRId.from("ADR-0099") });
      expect(traces).toEqual([]);
    });

    it("appendTrace and findTraces round-trip all fields", async () => {
      const adrId = ADRId.from("ADR-0001");
      const adr = ADR.create({ id: adrId, title: "A", author: "alice" });
      const taskId = TaskId.from("TASK-0001");
      await repo.saveADR(adr);

      const original = Trace.create({
        id: TraceId.from("TRACE-0001"),
        adrId,
        taskId,
        actor: "agent-007",
        actorType: "agent",
        event: "task_completed",
        ref: "sha-abc",
        from: "in-progress",
        to: "completed",
        body: "Completed by agent",
      });
      await repo.appendTrace(original);

      const [found] = await repo.findTraces({});
      expect(found?.id.toString()).toBe("TRACE-0001");
      expect(found?.taskId?.toString()).toBe("TASK-0001");
      expect(found?.actor).toBe("agent-007");
      expect(found?.actorType).toBe("agent");
      expect(found?.event).toBe("task_completed");
      expect(found?.ref).toBe("sha-abc");
      expect(found?.from).toBe("in-progress");
      expect(found?.to).toBe("completed");
      expect(found?.body).toBe("Completed by agent");
    });
  });
});
