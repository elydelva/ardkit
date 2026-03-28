import type { ADRId } from "../../value-objects/adr-id/adr-id.js";
import type { ADRStatus } from "../../value-objects/status/status.js";

export interface Rule {
  trigger: "before_edit" | "after_edit" | "before_complete" | "after_complete" | "on_conflict";
  instruction: string;
  id?: string;
}

export interface ADR {
  id: ADRId;
  title: string;
  status: ADRStatus;
  createdAt: Date;
  updatedAt: Date;
  author: string;
  tags: string[];
  phase: string;
  dependsOn: ADRId[];
  relatedTo: ADRId[];
  conflictsWith: ADRId[];
  supersedes: ADRId | null;
  supersededBy: ADRId | null;
  rules: Rule[];
  body: string;
}

export interface CreateADRParams {
  id: ADRId;
  title: string;
  author: string;
  tags?: string[];
  phase?: string;
  dependsOn?: ADRId[];
  relatedTo?: ADRId[];
  conflictsWith?: ADRId[];
  supersedes?: ADRId | null;
  rules?: Rule[];
  body?: string;
}

export const ADR = {
  create(params: CreateADRParams): ADR {
    const now = new Date();
    return {
      id: params.id,
      title: params.title,
      status: "draft",
      createdAt: now,
      updatedAt: now,
      author: params.author,
      tags: params.tags ?? [],
      phase: params.phase ?? "default",
      dependsOn: params.dependsOn ?? [],
      relatedTo: params.relatedTo ?? [],
      conflictsWith: params.conflictsWith ?? [],
      supersedes: params.supersedes ?? null,
      supersededBy: null,
      rules: params.rules ?? [],
      body: params.body ?? "",
    };
  },
};
