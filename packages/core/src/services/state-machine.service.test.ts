import { beforeEach, describe, expect, it } from "bun:test";
import { InvalidTransitionError } from "../errors.js";
import { StateMachineService } from "./state-machine.service.js";

describe("StateMachineService", () => {
  let sm: StateMachineService;

  beforeEach(() => {
    sm = new StateMachineService();
  });

  describe("ADR transitions", () => {
    it("allows valid transitions", () => {
      expect(sm.isValidADRTransition("draft", "proposed")).toBe(true);
      expect(sm.isValidADRTransition("draft", "abandoned")).toBe(true);
      expect(sm.isValidADRTransition("proposed", "accepted")).toBe(true);
      expect(sm.isValidADRTransition("accepted", "in-progress")).toBe(true);
      expect(sm.isValidADRTransition("in-progress", "completed")).toBe(true);
      expect(sm.isValidADRTransition("completed", "superseded")).toBe(true);
      expect(sm.isValidADRTransition("deferred", "accepted")).toBe(true);
    });

    it("rejects invalid transitions", () => {
      expect(sm.isValidADRTransition("draft", "completed")).toBe(false);
      expect(sm.isValidADRTransition("completed", "draft")).toBe(false);
      expect(sm.isValidADRTransition("abandoned", "draft")).toBe(false);
    });

    it("throws on invalid transition via validate", () => {
      expect(() => sm.validateADRTransition("draft", "completed")).toThrow(InvalidTransitionError);
    });

    it("does not throw on valid transition via validate", () => {
      expect(() => sm.validateADRTransition("draft", "proposed")).not.toThrow();
    });
  });

  describe("Task transitions", () => {
    it("allows valid transitions", () => {
      expect(sm.isValidTaskTransition("not-started", "in-progress")).toBe(true);
      expect(sm.isValidTaskTransition("not-started", "skipped")).toBe(true);
      expect(sm.isValidTaskTransition("in-progress", "completed")).toBe(true);
      expect(sm.isValidTaskTransition("in-progress", "blocked")).toBe(true);
      expect(sm.isValidTaskTransition("blocked", "in-progress")).toBe(true);
    });

    it("rejects invalid transitions", () => {
      expect(sm.isValidTaskTransition("completed", "in-progress")).toBe(false);
      expect(sm.isValidTaskTransition("skipped", "in-progress")).toBe(false);
      expect(sm.isValidTaskTransition("abandoned", "in-progress")).toBe(false);
    });

    it("throws on invalid transition via validate", () => {
      expect(() => sm.validateTaskTransition("completed", "in-progress")).toThrow(
        InvalidTransitionError
      );
    });
  });
});
