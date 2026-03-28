// Value Objects
export { ADRId } from "./value-objects/adr-id.js";
export { TaskId } from "./value-objects/task-id.js";
export { TraceId } from "./value-objects/trace-id.js";
export type { ADRStatus, TaskStatus } from "./value-objects/status.js";

// Entities
export { ADR } from "./entities/adr.js";
export type { CreateADRParams, Rule } from "./entities/adr.js";
export { Task } from "./entities/task.js";
export type { CreateTaskParams } from "./entities/task.js";
export { Trace } from "./entities/trace.js";
export type { TraceEvent, CreateTraceParams } from "./entities/trace.js";

// Ports
export type {
  IRealmRepository,
  TraceFilter,
  CounterKey,
  RealmState,
} from "./ports/realm.repository.js";
export type { IGitAdapter } from "./ports/git.adapter.js";

// Services
export { StateMachineService } from "./services/state-machine.service.js";
export { DAGService } from "./services/dag.service.js";

// Use Cases
export { CreateADRUseCase } from "./use-cases/create-adr.js";
export { CreateTaskUseCase } from "./use-cases/create-task.js";
export { CompleteTaskUseCase } from "./use-cases/complete-task.js";
export { GetNextUseCase } from "./use-cases/get-next.js";
export type { NextResult } from "./use-cases/get-next.js";
export { GetContextUseCase } from "./use-cases/get-context.js";
export type { ContextFilter, RealmContext } from "./use-cases/get-context.js";

// Errors
export {
  InvalidTransitionError,
  GatesNotClearedError,
  ADRNotFoundError,
  TaskNotFoundError,
  InvalidIdError,
} from "./errors.js";
