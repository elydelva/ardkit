import { describe, expect, it } from "bun:test";
import { ADRId } from "@adrkit/core";
import { serializeADR } from "../serializers/adr.serializer.js";
import { parseADR } from "./adr.parser.js";

const SAMPLE_ADR_CONTENT = `---
id: ADR-0001
title: "Use TypeScript"
status: draft
createdAt: "2024-01-01T00:00:00.000Z"
updatedAt: "2024-01-01T00:00:00.000Z"
author: alice
tags:
  - typescript
phase: default
dependsOn: []
relatedTo: []
conflictsWith: []
supersedes: null
supersededBy: null
rules: []
---
Body content here.`;

describe("parseADR", () => {
  it("parses a valid ADR file", () => {
    const adr = parseADR(SAMPLE_ADR_CONTENT);
    expect(adr.id.toString()).toBe("ADR-0001");
    expect(adr.title).toBe("Use TypeScript");
    expect(adr.status).toBe("draft");
    expect(adr.author).toBe("alice");
    expect(adr.tags).toEqual(["typescript"]);
    expect(adr.body).toBe("Body content here.");
    expect(adr.supersedes).toBeNull();
    expect(adr.supersededBy).toBeNull();
  });

  it("defaults missing fields gracefully", () => {
    const content = `---
id: ADR-0001
---
`;
    const adr = parseADR(content);
    expect(adr.status).toBe("draft");
    expect(adr.tags).toEqual([]);
    expect(adr.dependsOn).toEqual([]);
  });
});

describe("ADR round-trip", () => {
  it("serializes and parses back to equivalent ADR", () => {
    const original = parseADR(SAMPLE_ADR_CONTENT);
    const serialized = serializeADR(original);
    const reparsed = parseADR(serialized);
    expect(reparsed.id.toString()).toBe(original.id.toString());
    expect(reparsed.title).toBe(original.title);
    expect(reparsed.status).toBe(original.status);
    expect(reparsed.body).toBe(original.body);
  });
});
