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

    it("findTraces returns empty array (v0.1)", async () => {
      const traces = await repo.findTraces({});
      expect(traces).toEqual([]);
    });
  });
});
