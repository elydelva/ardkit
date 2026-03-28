import { Task } from "../entities/task.js";
import type { CreateTaskParams } from "../entities/task.js";
import { Trace } from "../entities/trace.js";
import { ADRNotFoundError } from "../errors.js";
import type { IGitAdapter } from "../ports/git.adapter.js";
import type { IRealmRepository } from "../ports/realm.repository.js";
import { TaskId } from "../value-objects/task-id.js";
import { TraceId } from "../value-objects/trace-id.js";

type CreateTaskInput = Omit<CreateTaskParams, "id"> & {
  actor?: string;
  actorType?: "human" | "agent";
};

export class CreateTaskUseCase {
  constructor(
    private readonly repo: IRealmRepository,
    private readonly git?: IGitAdapter
  ) {}

  async execute(input: CreateTaskInput): Promise<Task> {
    const adr = await this.repo.findADR(input.adrId);
    if (!adr) {
      throw new ADRNotFoundError(input.adrId.toString());
    }

    const counter = await this.repo.incrementCounter("task");
    const id = TaskId.generate(counter);

    const task = Task.create({ ...input, id });
    await this.repo.saveTask(task);

    const traceCounter = await this.repo.incrementCounter("trace");
    const trace = Trace.create({
      id: TraceId.generate(traceCounter),
      adrId: input.adrId,
      taskId: id,
      actor: input.actor ?? input.author,
      actorType: input.actorType ?? "human",
      event: "task_created",
    });
    await this.repo.appendTrace(trace);

    if (this.git) {
      await this.git.stage([`adrs/${input.adrId.toString()}/tasks/${id.toString()}`]);
    }

    return task;
  }
}
