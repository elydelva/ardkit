import { describe, expect, it } from "bun:test";
import { InvalidIdError } from "../../errors/errors.js";
import { ADRId } from "./adr-id.js";

describe("ADRId", () => {
  it("creates from valid format", () => {
    const id = ADRId.from("ADR-0001");
    expect(id.toString()).toBe("ADR-0001");
  });

  it("throws on invalid format", () => {
    expect(() => ADRId.from("adr-0001")).toThrow(InvalidIdError);
    expect(() => ADRId.from("ADR-1")).toThrow(InvalidIdError);
    expect(() => ADRId.from("ADR-ABCD")).toThrow(InvalidIdError);
    expect(() => ADRId.from("")).toThrow(InvalidIdError);
  });

  it("generates from counter", () => {
    expect(ADRId.generate(1).toString()).toBe("ADR-0001");
    expect(ADRId.generate(42).toString()).toBe("ADR-0042");
    expect(ADRId.generate(9999).toString()).toBe("ADR-9999");
  });

  it("equals works", () => {
    const a = ADRId.from("ADR-0001");
    const b = ADRId.from("ADR-0001");
    const c = ADRId.from("ADR-0002");
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});
