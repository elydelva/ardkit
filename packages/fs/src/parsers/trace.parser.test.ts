import { describe, expect, it } from "bun:test";
import { ADRId, TaskId, TraceId } from "@adrkit/core";
import { Trace } from "@adrkit/core";
import { serializeTrace } from "../serializers/trace.serializer.js";
import { parseTrace } from "./trace.parser.js";

const adrId = ADRId.from("ADR-0001");

function makeTrace(overrides: Partial<Parameters<typeof Trace.create>[0]> = {}) {
  return Trace.create({
    id: TraceId.from("TRACE-0001"),
    adrId,
    actor: "alice",
    actorType: "human",
    event: "adr_created",
    ...overrides,
  });
}

describe("parseTrace", () => {
  it("round-trips a minimal trace", () => {
    const trace = makeTrace();
    const parsed = parseTrace(serializeTrace(trace), adrId);

    expect(parsed.id.toString()).toBe("TRACE-0001");
    expect(parsed.adrId.toString()).toBe("ADR-0001");
    expect(parsed.taskId).toBeNull();
    expect(parsed.actor).toBe("alice");
    expect(parsed.actorType).toBe("human");
    expect(parsed.event).toBe("adr_created");
    expect(parsed.ref).toBeNull();
    expect(parsed.from).toBeNull();
    expect(parsed.to).toBeNull();
    expect(parsed.body).toBe("");
  });

  it("round-trips a trace with taskId", () => {
    const trace = makeTrace({ taskId: TaskId.from("TASK-0003"), event: "task_completed" });
    const parsed = parseTrace(serializeTrace(trace), adrId);
    expect(parsed.taskId?.toString()).toBe("TASK-0003");
    expect(parsed.event).toBe("task_completed");
  });

  it("round-trips a trace with from/to transition", () => {
    const trace = makeTrace({ event: "adr_status_changed", from: "proposed", to: "accepted" });
    const parsed = parseTrace(serializeTrace(trace), adrId);
    expect(parsed.from).toBe("proposed");
    expect(parsed.to).toBe("accepted");
  });

  it("round-trips a trace with actorType agent", () => {
    const trace = makeTrace({ actorType: "agent" });
    const parsed = parseTrace(serializeTrace(trace), adrId);
    expect(parsed.actorType).toBe("agent");
  });

  it("round-trips a trace with body", () => {
    const trace = makeTrace({ body: "Some note" });
    const parsed = parseTrace(serializeTrace(trace), adrId);
    expect(parsed.body).toBe("Some note");
  });

  it("round-trips a trace with ref", () => {
    const trace = makeTrace({ ref: "abc123" });
    const parsed = parseTrace(serializeTrace(trace), adrId);
    expect(parsed.ref).toBe("abc123");
  });

  it("preserves at timestamp", () => {
    const trace = makeTrace();
    const content = serializeTrace(trace);
    const parsed = parseTrace(content, adrId);
    expect(parsed.at.getTime()).toBe(trace.at.getTime());
  });

  it("falls back to adrId param when adrId is missing from frontmatter", () => {
    const content =
      "---\nid: TRACE-0001\nadrId: INVALID\nactor: alice\nactorType: human\nevent: note\n---";
    const parsed = parseTrace(content, adrId);
    expect(parsed.adrId.toString()).toBe("ADR-0001");
  });

  it("defaults event to note for unknown values", () => {
    const content =
      "---\nid: TRACE-0001\nadrId: ADR-0001\nactor: alice\nactorType: human\nevent: unknown_event\n---";
    const parsed = parseTrace(content, adrId);
    expect(parsed.event).toBe("note");
  });

  it("defaults actorType to human for unknown values", () => {
    const content =
      "---\nid: TRACE-0001\nadrId: ADR-0001\nactor: alice\nactorType: robot\nevent: note\n---";
    const parsed = parseTrace(content, adrId);
    expect(parsed.actorType).toBe("human");
  });

  it("ignores invalid taskId (returns null)", () => {
    const content =
      "---\nid: TRACE-0001\nadrId: ADR-0001\ntaskId: NOT-A-TASK\nactor: alice\nactorType: human\nevent: note\n---";
    const parsed = parseTrace(content, adrId);
    expect(parsed.taskId).toBeNull();
  });

  it("handles all valid TraceEvent values", () => {
    const events = [
      "adr_created",
      "adr_status_changed",
      "task_created",
      "task_started",
      "task_completed",
      "task_abandoned",
      "rules_acknowledged",
      "note",
      "synced",
    ] as const;

    for (const event of events) {
      const trace = makeTrace({ event });
      const parsed = parseTrace(serializeTrace(trace), adrId);
      expect(parsed.event).toBe(event);
    }
  });
});
