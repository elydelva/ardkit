import type { ADRId } from "../../value-objects/adr-id/adr-id.js";
import type { TaskId } from "../../value-objects/task-id/task-id.js";
import type { TraceId } from "../../value-objects/trace-id/trace-id.js";

export type TraceEvent =
  | "adr_created"
  | "adr_status_changed"
  | "task_created"
  | "task_started"
  | "task_completed"
  | "task_abandoned"
  | "rules_acknowledged"
  | "note"
  | "synced";

export interface Trace {
  id: TraceId;
  adrId: ADRId;
  taskId: TaskId | null;
  at: Date;
  actor: string;
  actorType: "human" | "agent";
  event: TraceEvent;
  ref: string | null;
  from: string | null;
  to: string | null;
  body: string;
}

export interface CreateTraceParams {
  id: TraceId;
  adrId: ADRId;
  taskId?: TaskId | null;
  actor: string;
  actorType: "human" | "agent";
  event: TraceEvent;
  ref?: string | null;
  from?: string | null;
  to?: string | null;
  body?: string;
}

export const Trace = {
  create(params: CreateTraceParams): Trace {
    return {
      id: params.id,
      adrId: params.adrId,
      taskId: params.taskId ?? null,
      at: new Date(),
      actor: params.actor,
      actorType: params.actorType,
      event: params.event,
      ref: params.ref ?? null,
      from: params.from ?? null,
      to: params.to ?? null,
      body: params.body ?? "",
    };
  },
};
