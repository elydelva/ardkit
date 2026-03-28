import type { ADRId } from "../../value-objects/adr-id/adr-id.js";
import type { TaskStatus } from "../../value-objects/status/status.js";
import type { TaskId } from "../../value-objects/task-id/task-id.js";
import type { Rule } from "../adr/adr.js";

export interface Task {
  id: TaskId;
  adrId: ADRId;
  title: string;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  author: string;
  assignee: string | null;
  estimatedHours: number | null;
  gates: Array<TaskId | string>;
  rules: Rule[];
  body: string;
}

export interface CreateTaskParams {
  id: TaskId;
  adrId: ADRId;
  title: string;
  author: string;
  assignee?: string | null;
  estimatedHours?: number | null;
  gates?: Array<TaskId | string>;
  rules?: Rule[];
  body?: string;
}

export const Task = {
  create(params: CreateTaskParams): Task {
    const now = new Date();
    return {
      id: params.id,
      adrId: params.adrId,
      title: params.title,
      status: "not-started",
      createdAt: now,
      updatedAt: now,
      startedAt: null,
      completedAt: null,
      author: params.author,
      assignee: params.assignee ?? null,
      estimatedHours: params.estimatedHours ?? null,
      gates: params.gates ?? [],
      rules: params.rules ?? [],
      body: params.body ?? "",
    };
  },
};
