import type { Task } from "../entities/task.js";
import { Trace } from "../entities/trace.js";
import { GatesNotClearedError, TaskNotFoundError } from "../errors.js";
import type { IGitAdapter } from "../ports/git.adapter.js";
import type { IRealmRepository } from "../ports/realm.repository.js";
import { DAGService } from "../services/dag.service.js";
import { StateMachineService } from "../services/state-machine.service.js";
import type { TaskId } from "../value-objects/task-id.js";
import { TraceId } from "../value-objects/trace-id.js";

interface CompleteTaskInput {
  id: TaskId;
  actor: string;
  actorType?: "human" | "agent";
}

export class CompleteTaskUseCase {
  private readonly stateMachine = new StateMachineService();
  private readonly dagService = new DAGService();

  constructor(
    private readonly repo: IRealmRepository,
    private readonly git?: IGitAdapter
  ) {}

  async execute(input: CompleteTaskInput): Promise<Task> {
    const task = await this.repo.findTask(input.id);
    if (!task) {
      throw new TaskNotFoundError(input.id.toString());
    }

    const allTasks = await this.repo.findAllTasks();
    if (!this.dagService.areGatesCleared(task, allTasks)) {
      throw new GatesNotClearedError(task.id.toString());
    }

    this.stateMachine.validateTaskTransition(task.status, "completed");

    const now = new Date();
    const updated: Task = {
      ...task,
      status: "completed",
      completedAt: now,
      updatedAt: now,
    };
    await this.repo.saveTask(updated);

    const traceCounter = await this.repo.incrementCounter("trace");
    const trace = Trace.create({
      id: TraceId.generate(traceCounter),
      adrId: task.adrId,
      taskId: task.id,
      actor: input.actor,
      actorType: input.actorType ?? "human",
      event: "task_completed",
      from: task.status,
      to: "completed",
    });
    await this.repo.appendTrace(trace);

    if (this.git) {
      await this.git.stage([`adrs/${task.adrId.toString()}/tasks/${task.id.toString()}`]);
    }

    return updated;
  }
}
