import type { ADR } from "@adrkit/core";
import { stringifyFrontmatter } from "../parsers/frontmatter.parser.js";

export function serializeADR(adr: ADR): string {
  const data: Record<string, unknown> = {
    id: adr.id.toString(),
    title: adr.title,
    status: adr.status,
    createdAt: adr.createdAt.toISOString(),
    updatedAt: adr.updatedAt.toISOString(),
    author: adr.author,
    tags: adr.tags,
    phase: adr.phase,
    dependsOn: adr.dependsOn.map((id) => id.toString()),
    relatedTo: adr.relatedTo.map((id) => id.toString()),
    conflictsWith: adr.conflictsWith.map((id) => id.toString()),
    supersedes: adr.supersedes?.toString() ?? null,
    supersededBy: adr.supersededBy?.toString() ?? null,
    rules: adr.rules,
  };

  return stringifyFrontmatter(data, adr.body);
}
