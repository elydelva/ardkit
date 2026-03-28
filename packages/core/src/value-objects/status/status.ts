export type ADRStatus =
  | "draft"
  | "proposed"
  | "accepted"
  | "in-progress"
  | "completed"
  | "abandoned"
  | "superseded"
  | "deferred";

export type TaskStatus =
  | "not-started"
  | "in-progress"
  | "completed"
  | "abandoned"
  | "blocked"
  | "skipped";
