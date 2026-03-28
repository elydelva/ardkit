import { describe, expect, it } from "bun:test";
import { ADR } from "../../entities/adr/adr.js";
import { Task } from "../../entities/task/task.js";
import { ADRId } from "../../value-objects/adr-id/adr-id.js";
import { TaskId } from "../../value-objects/task-id/task-id.js";
import { DAGService } from "./dag.service.js";

function makeTask(
  n: number,
  gates: Array<TaskId | string> = [],
  status: Task["status"] = "not-started"
): Task {
  const t = Task.create({
    id: TaskId.generate(n),
    adrId: ADRId.generate(1),
    title: `Task ${n}`,
    author: "test",
    gates,
  });
  return { ...t, status };
}

function makeADR(n: number, status: ADR["status"] = "accepted"): ADR {
  const a = ADR.create({ id: ADRId.generate(n), title: `ADR ${n}`, author: "test" });
  return { ...a, status };
}

describe("DAGService", () => {
  const dag = new DAGService();

  describe("areGatesCleared", () => {
    it("returns true when no gates", () => {
      const task = makeTask(1);
      expect(dag.areGatesCleared(task, [task])).toBe(true);
    });

    it("returns true when all gate tasks are completed", () => {
      const dep = makeTask(1, [], "completed");
      const task = makeTask(2, [dep.id]);
      expect(dag.areGatesCleared(task, [dep, task])).toBe(true);
    });

    it("returns false when a gate task is not completed", () => {
      const dep = makeTask(1, [], "in-progress");
      const task = makeTask(2, [dep.id]);
      expect(dag.areGatesCleared(task, [dep, task])).toBe(false);
    });

    it("treats string gates as cleared", () => {
      const task = makeTask(1, ["external-thing"]);
      expect(dag.areGatesCleared(task, [task])).toBe(true);
    });
  });

  describe("getEligibleTasks", () => {
    it("returns not-started tasks from active ADRs with cleared gates", () => {
      const adr = makeADR(1, "accepted");
      const task = makeTask(1);
      const result = dag.getEligibleTasks([task], [adr]);
      expect(result).toHaveLength(1);
    });

    it("excludes tasks from non-active ADRs", () => {
      const adr = makeADR(1, "draft");
      const task = makeTask(1);
      const result = dag.getEligibleTasks([task], [adr]);
      expect(result).toHaveLength(0);
    });

    it("excludes completed tasks", () => {
      const adr = makeADR(1, "accepted");
      const task = makeTask(1, [], "completed");
      const result = dag.getEligibleTasks([task], [adr]);
      expect(result).toHaveLength(0);
    });

    it("excludes tasks whose gates are not cleared", () => {
      const adr = makeADR(1, "accepted");
      const dep = makeTask(1, [], "in-progress");
      const task = makeTask(2, [dep.id]);
      const result = dag.getEligibleTasks([dep, task], [adr]);
      // dep is in-progress — not eligible (status != not-started/blocked)
      // task gates not cleared — not eligible
      expect(result).toHaveLength(0);
    });
  });

  describe("getBlockedTasks", () => {
    it("returns blocked status tasks", () => {
      const task = makeTask(1, [], "blocked");
      expect(dag.getBlockedTasks([task])).toHaveLength(1);
    });

    it("returns tasks with uncleared gates", () => {
      const dep = makeTask(1, [], "in-progress");
      const task = makeTask(2, [dep.id]);
      const blocked = dag.getBlockedTasks([dep, task]);
      expect(blocked.map((t) => t.id.toString())).toContain("TASK-0002");
    });
  });
});
