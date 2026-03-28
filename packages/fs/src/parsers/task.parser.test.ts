import { describe, expect, it } from "bun:test";
import { ADRId, TaskId } from "@adrkit/core";
import { serializeTask } from "../serializers/task.serializer.js";
import { parseTask } from "./task.parser.js";

const SAMPLE_TASK_CONTENT = `---
id: TASK-0001
adrId: ADR-0001
title: "Implement parser"
status: not-started
createdAt: "2024-01-01T00:00:00.000Z"
updatedAt: "2024-01-01T00:00:00.000Z"
startedAt: null
completedAt: null
author: alice
assignee: null
estimatedHours: null
gates: []
rules: []
---
Task body here.`;

describe("parseTask", () => {
  it("parses a valid task file", () => {
    const adrId = ADRId.from("ADR-0001");
    const task = parseTask(SAMPLE_TASK_CONTENT, adrId);
    expect(task.id.toString()).toBe("TASK-0001");
    expect(task.title).toBe("Implement parser");
    expect(task.status).toBe("not-started");
    expect(task.author).toBe("alice");
    expect(task.body).toBe("Task body here.");
    expect(task.startedAt).toBeNull();
    expect(task.completedAt).toBeNull();
  });

  it("defaults missing fields gracefully", () => {
    const adrId = ADRId.from("ADR-0001");
    const task = parseTask("---\nid: TASK-0002\n---\n", adrId);
    expect(task.status).toBe("not-started");
    expect(task.author).toBe("");
    expect(task.assignee).toBeNull();
    expect(task.estimatedHours).toBeNull();
    expect(task.gates).toEqual([]);
    expect(task.rules).toEqual([]);
  });

  it("parses gates as TaskId instances for TASK-XXXX format", () => {
    const adrId = ADRId.from("ADR-0001");
    const content = "---\nid: TASK-0003\ngates: [TASK-0001, TASK-0002]\n---\n";
    const task = parseTask(content, adrId);
    expect(task.gates[0]).toBeInstanceOf(TaskId);
    expect(task.gates[1]).toBeInstanceOf(TaskId);
  });

  it("parses gates as strings for cross-ADR format", () => {
    const adrId = ADRId.from("ADR-0001");
    const content = "---\nid: TASK-0003\ngates: [ADR-0001/TASK-0002]\n---\n";
    const task = parseTask(content, adrId);
    expect(typeof task.gates[0]).toBe("string");
  });

  it("parses rules array", () => {
    const adrId = ADRId.from("ADR-0001");
    const content =
      "---\nid: TASK-0004\nrules:\n  - trigger: before_edit\n    instruction: check something\n---\n";
    const task = parseTask(content, adrId);
    expect(task.rules).toHaveLength(1);
    expect(task.rules[0]?.trigger).toBe("before_edit");
  });

  it("parses startedAt and completedAt when set", () => {
    const adrId = ADRId.from("ADR-0001");
    const content = `---\nid: TASK-0005\nstartedAt: "2024-02-01T00:00:00.000Z"\ncompletedAt: "2024-02-02T00:00:00.000Z"\n---\n`;
    const task = parseTask(content, adrId);
    expect(task.startedAt).not.toBeNull();
    expect(task.completedAt).not.toBeNull();
  });
});

describe("Task round-trip", () => {
  it("serializes and parses back to equivalent task", () => {
    const adrId = ADRId.from("ADR-0001");
    const original = parseTask(SAMPLE_TASK_CONTENT, adrId);
    const serialized = serializeTask(original);
    const reparsed = parseTask(serialized, adrId);
    expect(reparsed.id.toString()).toBe(original.id.toString());
    expect(reparsed.title).toBe(original.title);
    expect(reparsed.status).toBe(original.status);
    expect(reparsed.body).toBe(original.body);
  });
});
