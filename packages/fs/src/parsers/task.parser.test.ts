import { describe, expect, it } from "bun:test";
import { ADRId } from "@adrkit/core";
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
