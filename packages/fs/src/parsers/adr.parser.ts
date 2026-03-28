import type { ADR, Rule } from "@adrkit/core";
import { ADRId } from "@adrkit/core";
import type { ADRStatus } from "@adrkit/core";
import { parseFrontmatter } from "./frontmatter.parser.js";

function toStringArray(val: unknown): string[] {
  if (!Array.isArray(val)) return [];
  return val.filter((v): v is string => typeof v === "string");
}

function toRuleArray(val: unknown): Rule[] {
  if (!Array.isArray(val)) return [];
  return val.filter(
    (v): v is Rule =>
      typeof v === "object" &&
      v !== null &&
      typeof (v as Record<string, unknown>).trigger === "string" &&
      typeof (v as Record<string, unknown>).instruction === "string"
  );
}

function toADRStatus(val: unknown): ADRStatus {
  const valid: ADRStatus[] = [
    "draft",
    "proposed",
    "accepted",
    "in-progress",
    "completed",
    "abandoned",
    "superseded",
    "deferred",
  ];
  if (typeof val === "string" && valid.includes(val as ADRStatus)) {
    return val as ADRStatus;
  }
  return "draft";
}

function toDate(val: unknown): Date {
  if (val instanceof Date) return val;
  if (typeof val === "string" || typeof val === "number") {
    const d = new Date(val);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

function toADRIdOrNull(val: unknown): ADRId | null {
  if (typeof val === "string" && val.length > 0) {
    try {
      return ADRId.from(val);
    } catch {
      return null;
    }
  }
  return null;
}

function toADRIdArray(val: unknown): ADRId[] {
  if (!Array.isArray(val)) return [];
  return val.flatMap((v) => {
    const id = toADRIdOrNull(v);
    return id !== null ? [id] : [];
  });
}

export function parseADR(content: string): ADR {
  const { data, body } = parseFrontmatter(content);

  const id = ADRId.from(String(data.id ?? ""));
  const title = typeof data.title === "string" ? data.title : "";
  const status = toADRStatus(data.status);
  const createdAt = toDate(data.createdAt);
  const updatedAt = toDate(data.updatedAt);
  const author = typeof data.author === "string" ? data.author : "";
  const tags = toStringArray(data.tags);
  const phase = typeof data.phase === "string" ? data.phase : "default";
  const dependsOn = toADRIdArray(data.dependsOn);
  const relatedTo = toADRIdArray(data.relatedTo);
  const conflictsWith = toADRIdArray(data.conflictsWith);
  const supersedes = toADRIdOrNull(data.supersedes);
  const supersededBy = toADRIdOrNull(data.supersededBy);
  const rules = toRuleArray(data.rules);

  return {
    id,
    title,
    status,
    createdAt,
    updatedAt,
    author,
    tags,
    phase,
    dependsOn,
    relatedTo,
    conflictsWith,
    supersedes,
    supersededBy,
    rules,
    body,
  };
}
