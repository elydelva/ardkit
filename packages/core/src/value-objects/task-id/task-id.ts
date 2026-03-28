import { InvalidIdError } from "../../errors/errors.js";

const TASK_ID_REGEX = /^TASK-\d{4}$/;

export class TaskId {
  private constructor(private readonly value: string) {}

  static from(raw: string): TaskId {
    if (!TASK_ID_REGEX.test(raw)) {
      throw new InvalidIdError(`Invalid TaskId format: "${raw}". Expected TASK-XXXX`);
    }
    return new TaskId(raw);
  }

  static generate(counter: number): TaskId {
    const padded = String(counter).padStart(4, "0");
    return new TaskId(`TASK-${padded}`);
  }

  toString(): string {
    return this.value;
  }

  equals(other: TaskId): boolean {
    return this.value === other.value;
  }
}
