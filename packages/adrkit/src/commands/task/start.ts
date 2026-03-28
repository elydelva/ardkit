import {
  StateMachineService,
  type Task,
  TaskId,
  TaskNotFoundError,
  Trace,
  TraceId,
} from "@adrkit/core";
import type { Container } from "../../container.js";

export async function runTaskStart(container: Container, taskIdRaw: string): Promise<void> {
  const taskId = TaskId.from(taskIdRaw);
  const task = await container.repo.findTask(taskId);
  if (!task) {
    throw new TaskNotFoundError(taskIdRaw);
  }

  const stateMachine = new StateMachineService();
  stateMachine.validateTaskTransition(task.status, "in-progress");

  const now = new Date();
  const updated: Task = {
    ...task,
    status: "in-progress",
    startedAt: now,
    updatedAt: now,
  };
  await container.repo.saveTask(updated);

  const actor = process.env.GIT_AUTHOR_NAME ?? process.env.USER ?? "unknown";
  const traceCounter = await container.repo.incrementCounter("trace");
  const trace = Trace.create({
    id: TraceId.generate(traceCounter),
    adrId: task.adrId,
    taskId: task.id,
    actor,
    actorType: "human",
    event: "task_started",
    from: task.status,
    to: "in-progress",
  });
  await container.repo.appendTrace(trace);

  console.log(`✓ Started ${task.id.toString()} — ${task.title}`);
}
