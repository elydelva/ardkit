import type { ADR } from "../entities/adr.js";
import type { Task } from "../entities/task.js";
import type { Trace } from "../entities/trace.js";
import type { IRealmRepository } from "../ports/realm.repository.js";
import type { ADRId } from "../value-objects/adr-id.js";

export interface ContextFilter {
  adrId?: ADRId;
  activeOnly?: boolean;
}

export interface RealmContext {
  adrs: ADR[];
  tasks: Task[];
  traces: Trace[];
}

export class GetContextUseCase {
  constructor(private readonly repo: IRealmRepository) {}

  async execute(filter: ContextFilter = {}): Promise<RealmContext> {
    let adrs = filter.adrId
      ? await this.repo.findADR(filter.adrId).then((a) => (a ? [a] : []))
      : await this.repo.findAllADRs();

    if (filter.activeOnly) {
      adrs = adrs.filter(
        (a) => a.status === "accepted" || a.status === "in-progress" || a.status === "proposed"
      );
    }

    const adrIds = new Set(adrs.map((a) => a.id.toString()));

    const allTasks = await this.repo.findAllTasks();
    const tasks = allTasks.filter((t) => adrIds.has(t.adrId.toString()));

    const traces = await this.repo.findTraces(filter.adrId ? { adrId: filter.adrId } : {});

    return { adrs, tasks, traces };
  }
}
