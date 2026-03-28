import type { Trace } from "../../entities/index.js";
import type { IRealmRepository, TraceFilter } from "../../ports/index.js";

export type HistoryFilter = TraceFilter;

export class GetHistoryUseCase {
  constructor(private readonly repo: IRealmRepository) {}

  async execute(filter: HistoryFilter = {}): Promise<Trace[]> {
    const traces = await this.repo.findTraces(filter);
    return traces.slice().sort((a, b) => a.at.getTime() - b.at.getTime());
  }
}
