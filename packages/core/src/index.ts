// Value Objects
export { ADRId, TaskId, TraceId } from "./value-objects/index.js";
export type { ADRStatus, TaskStatus } from "./value-objects/index.js";

// Entities
export { ADR, Task, Trace } from "./entities/index.js";
export type {
  CreateADRParams,
  Rule,
  CreateTaskParams,
  TraceEvent,
  CreateTraceParams,
} from "./entities/index.js";

// Ports
export type {
  IRealmRepository,
  TraceFilter,
  CounterKey,
  RealmState,
  IGitAdapter,
} from "./ports/index.js";

// Services
export { StateMachineService, DAGService } from "./services/index.js";

// Use Cases
export {
  CreateADRUseCase,
  CreateTaskUseCase,
  CompleteTaskUseCase,
  GetNextUseCase,
  GetContextUseCase,
  GetHistoryUseCase,
} from "./use-cases/index.js";
export type { NextResult, ContextFilter, RealmContext, HistoryFilter } from "./use-cases/index.js";

// Errors
export {
  InvalidTransitionError,
  GatesNotClearedError,
  ADRNotFoundError,
  TaskNotFoundError,
  InvalidIdError,
} from "./errors/index.js";
