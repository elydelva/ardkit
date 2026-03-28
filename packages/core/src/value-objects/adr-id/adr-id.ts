import { InvalidIdError } from "../../errors/errors.js";

const ADR_ID_REGEX = /^ADR-\d{4}$/;

export class ADRId {
  private constructor(private readonly value: string) {}

  static from(raw: string): ADRId {
    if (!ADR_ID_REGEX.test(raw)) {
      throw new InvalidIdError(`Invalid ADRId format: "${raw}". Expected ADR-XXXX`);
    }
    return new ADRId(raw);
  }

  static generate(counter: number): ADRId {
    const padded = String(counter).padStart(4, "0");
    return new ADRId(`ADR-${padded}`);
  }

  toString(): string {
    return this.value;
  }

  equals(other: ADRId): boolean {
    return this.value === other.value;
  }
}
