export class InvalidTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`Invalid transition from "${from}" to "${to}"`);
    this.name = "InvalidTransitionError";
  }
}

export class GatesNotClearedError extends Error {
  constructor(taskId: string) {
    super(`Gates not cleared for task "${taskId}"`);
    this.name = "GatesNotClearedError";
  }
}

export class ADRNotFoundError extends Error {
  constructor(id: string) {
    super(`ADR not found: "${id}"`);
    this.name = "ADRNotFoundError";
  }
}

export class TaskNotFoundError extends Error {
  constructor(id: string) {
    super(`Task not found: "${id}"`);
    this.name = "TaskNotFoundError";
  }
}

export class InvalidIdError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidIdError";
  }
}
