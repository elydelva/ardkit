import { describe, expect, it } from "bun:test";
import { InvalidIdError } from "../errors.js";
import { TaskId } from "./task-id.js";

describe("TaskId", () => {
  it("creates from valid format", () => {
    const id = TaskId.from("TASK-0001");
    expect(id.toString()).toBe("TASK-0001");
  });

  it("throws on invalid format", () => {
    expect(() => TaskId.from("task-0001")).toThrow(InvalidIdError);
    expect(() => TaskId.from("TASK-1")).toThrow(InvalidIdError);
    expect(() => TaskId.from("TASK-ABCD")).toThrow(InvalidIdError);
    expect(() => TaskId.from("")).toThrow(InvalidIdError);
  });

  it("generates from counter", () => {
    expect(TaskId.generate(1).toString()).toBe("TASK-0001");
    expect(TaskId.generate(42).toString()).toBe("TASK-0042");
    expect(TaskId.generate(9999).toString()).toBe("TASK-9999");
  });

  it("equals works", () => {
    const a = TaskId.from("TASK-0001");
    const b = TaskId.from("TASK-0001");
    const c = TaskId.from("TASK-0002");
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});
