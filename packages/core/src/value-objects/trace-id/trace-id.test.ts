import { describe, expect, it } from "bun:test";
import { InvalidIdError } from "../../errors/errors.js";
import { TraceId } from "./trace-id.js";

describe("TraceId", () => {
  it("creates from valid format", () => {
    const id = TraceId.from("TRACE-0001");
    expect(id.toString()).toBe("TRACE-0001");
  });

  it("throws on invalid format", () => {
    expect(() => TraceId.from("trace-0001")).toThrow(InvalidIdError);
    expect(() => TraceId.from("TRACE-1")).toThrow(InvalidIdError);
    expect(() => TraceId.from("TRACE-ABCD")).toThrow(InvalidIdError);
    expect(() => TraceId.from("")).toThrow(InvalidIdError);
  });

  it("generates from counter", () => {
    expect(TraceId.generate(1).toString()).toBe("TRACE-0001");
    expect(TraceId.generate(42).toString()).toBe("TRACE-0042");
    expect(TraceId.generate(9999).toString()).toBe("TRACE-9999");
  });

  it("equals works", () => {
    const a = TraceId.from("TRACE-0001");
    const b = TraceId.from("TRACE-0001");
    const c = TraceId.from("TRACE-0002");
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});
