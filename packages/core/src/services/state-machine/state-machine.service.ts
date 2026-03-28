import { InvalidTransitionError } from "../../errors/errors.js";
import type { ADRStatus, TaskStatus } from "../../value-objects/status/status.js";

const ADR_TRANSITIONS: Record<ADRStatus, ADRStatus[]> = {
  draft: ["proposed", "abandoned"],
  proposed: ["accepted", "abandoned", "draft"],
  accepted: ["in-progress", "deferred", "abandoned"],
  "in-progress": ["completed", "abandoned", "deferred"],
  completed: ["superseded"],
  abandoned: [],
  superseded: [],
  deferred: ["accepted", "abandoned"],
};

const TASK_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  "not-started": ["in-progress", "skipped", "abandoned"],
  "in-progress": ["completed", "abandoned", "blocked"],
  blocked: ["in-progress", "abandoned"],
  skipped: [],
  completed: [],
  abandoned: [],
};

export class StateMachineService {
  isValidADRTransition(from: ADRStatus, to: ADRStatus): boolean {
    return ADR_TRANSITIONS[from].includes(to);
  }

  isValidTaskTransition(from: TaskStatus, to: TaskStatus): boolean {
    return TASK_TRANSITIONS[from].includes(to);
  }

  validateADRTransition(from: ADRStatus, to: ADRStatus): void {
    if (!this.isValidADRTransition(from, to)) {
      throw new InvalidTransitionError(from, to);
    }
  }

  validateTaskTransition(from: TaskStatus, to: TaskStatus): void {
    if (!this.isValidTaskTransition(from, to)) {
      throw new InvalidTransitionError(from, to);
    }
  }
}
