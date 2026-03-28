import { describe, expect, it } from "bun:test";
import { ADR, ADRId } from "@adrkit/core";
import { parseADR } from "../parsers/adr.parser.js";
import { serializeADR } from "./adr.serializer.js";

describe("serializeADR", () => {
  it("serializes an ADR with populated relation arrays", () => {
    const id = ADRId.generate(1);
    const dep = ADRId.generate(2);
    const rel = ADRId.generate(3);
    const conf = ADRId.generate(4);
    const sup = ADRId.generate(5);

    const adr: ReturnType<typeof ADR.create> = {
      ...ADR.create({
        id,
        title: "Test",
        author: "alice",
        dependsOn: [dep],
        relatedTo: [rel],
        conflictsWith: [conf],
        supersedes: sup,
      }),
    };

    const output = serializeADR(adr);
    expect(output).toContain("ADR-0002");
    expect(output).toContain("ADR-0003");
    expect(output).toContain("ADR-0004");
    expect(output).toContain("ADR-0005");
  });

  it("round-trips an ADR with all relation fields", () => {
    const id = ADRId.generate(1);
    const dep = ADRId.generate(2);
    const adr = ADR.create({
      id,
      title: "Round-trip",
      author: "bob",
      dependsOn: [dep],
      body: "content",
    });
    const reparsed = parseADR(serializeADR(adr));
    expect(reparsed.dependsOn[0]?.toString()).toBe("ADR-0002");
    expect(reparsed.body).toBe("content");
  });
});
