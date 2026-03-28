import { describe, expect, it } from "bun:test";
import { ADRId, Task, TaskId } from "@adrkit/core";
import { parseTask } from "../parsers/task.parser.js";
import { serializeTask } from "./task.serializer.js";

describe("serializeTask", () => {
  it("serializes a task with gates as TaskId instances", () => {
    const adrId = ADRId.generate(1);
    const id = TaskId.generate(1);
    const gateId = TaskId.generate(2);

    const task = Task.create({ id, adrId, title: "My task", author: "alice", gates: [gateId] });
    const output = serializeTask(task);
    expect(output).toContain("TASK-0002");
  });

  it("round-trips a task with gates", () => {
    const adrId = ADRId.generate(1);
    const id = TaskId.generate(1);
    const gateId = TaskId.generate(2);

    const task = Task.create({ id, adrId, title: "Gated task", author: "alice", gates: [gateId] });
    const reparsed = parseTask(serializeTask(task), adrId);
    expect(reparsed.gates[0]).toBeInstanceOf(TaskId);
    expect((reparsed.gates[0] as TaskId).toString()).toBe("TASK-0002");
  });
});
