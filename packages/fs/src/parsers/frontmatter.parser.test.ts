import { describe, expect, it } from "bun:test";
import { parseFrontmatter, stringifyFrontmatter } from "./frontmatter.parser.js";

describe("parseFrontmatter", () => {
  it("parses frontmatter and body", () => {
    const content = `---
id: ADR-0001
title: Test
---
Body text here`;
    const { data, body } = parseFrontmatter(content);
    expect(data.id).toBe("ADR-0001");
    expect(data.title).toBe("Test");
    expect(body).toBe("Body text here");
  });

  it("returns empty data and body when no frontmatter", () => {
    const { data, body } = parseFrontmatter("Just a body");
    expect(Object.keys(data)).toHaveLength(0);
    expect(body).toBe("Just a body");
  });
});

describe("stringifyFrontmatter", () => {
  it("round-trips data and body", () => {
    const data = { id: "ADR-0001", title: "Test" };
    const body = "Body text";
    const result = stringifyFrontmatter(data, body);
    const { data: parsed, body: parsedBody } = parseFrontmatter(result);
    expect(parsed.id).toBe("ADR-0001");
    expect(parsedBody).toBe("Body text");
  });
});
