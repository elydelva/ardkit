import { InvalidIdError } from "../errors.js";

const TRACE_ID_REGEX = /^TRACE-\d{4}$/;

export class TraceId {
  private constructor(private readonly value: string) {}

  static from(raw: string): TraceId {
    if (!TRACE_ID_REGEX.test(raw)) {
      throw new InvalidIdError(`Invalid TraceId format: "${raw}". Expected TRACE-XXXX`);
    }
    return new TraceId(raw);
  }

  static generate(counter: number): TraceId {
    const padded = String(counter).padStart(4, "0");
    return new TraceId(`TRACE-${padded}`);
  }

  toString(): string {
    return this.value;
  }

  equals(other: TraceId): boolean {
    return this.value === other.value;
  }
}
