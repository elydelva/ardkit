import type { ADR } from "../../entities/adr/adr.js";
import type { Task } from "../../entities/task/task.js";
import type { Trace, TraceEvent } from "../../entities/trace/trace.js";
import type { ADRId } from "../../value-objects/adr-id/adr-id.js";
import type { TaskId } from "../../value-objects/task-id/task-id.js";

export interface TraceFilter {
  adrId?: ADRId;
  taskId?: TaskId;
  actor?: string;
  event?: TraceEvent;
  since?: Date;
}

export type CounterKey = "adr" | "task" | "trace";

export interface RealmState {
  counters: Record<CounterKey, number>;
}

export interface IRealmRepository {
  findADR(id: ADRId): Promise<ADR | null>;
  findAllADRs(): Promise<ADR[]>;
  saveADR(adr: ADR): Promise<void>;
  findTask(id: TaskId): Promise<Task | null>;
  findTasksForADR(adrId: ADRId): Promise<Task[]>;
  findAllTasks(): Promise<Task[]>;
  saveTask(task: Task): Promise<void>;
  appendTrace(trace: Trace): Promise<void>;
  findTraces(filter: TraceFilter): Promise<Trace[]>;
  getState(): Promise<RealmState>;
  incrementCounter(entity: CounterKey): Promise<number>;
}
