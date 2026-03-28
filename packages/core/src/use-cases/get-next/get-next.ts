import type { ADR } from "../../entities/index.js";
import type { Task } from "../../entities/index.js";
import type { IRealmRepository } from "../../ports/index.js";
import { DAGService } from "../../services/index.js";

export interface NextResult {
  task: Task;
  adr: ADR;
}

export class GetNextUseCase {
  private readonly dagService = new DAGService();

  constructor(private readonly repo: IRealmRepository) {}

  async execute(): Promise<NextResult | null> {
    const [allTasks, allADRs] = await Promise.all([
      this.repo.findAllTasks(),
      this.repo.findAllADRs(),
    ]);

    const eligible = this.dagService.getEligibleTasks(allTasks, allADRs);
    if (eligible.length === 0) return null;

    const adrMap = new Map(allADRs.map((a) => [a.id.toString(), a]));

    // Sort: phase alphabetically → ADR createdAt → task createdAt
    const sorted = eligible.slice().sort((a, b) => {
      const adrA = adrMap.get(a.adrId.toString());
      const adrB = adrMap.get(b.adrId.toString());

      const phaseA = adrA?.phase ?? "";
      const phaseB = adrB?.phase ?? "";
      const phaseCmp = phaseA.localeCompare(phaseB);
      if (phaseCmp !== 0) return phaseCmp;

      const adrCreatedA = adrA?.createdAt.getTime() ?? 0;
      const adrCreatedB = adrB?.createdAt.getTime() ?? 0;
      if (adrCreatedA !== adrCreatedB) return adrCreatedA - adrCreatedB;

      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    const first = sorted[0];
    if (!first) return null;

    const adr = adrMap.get(first.adrId.toString());
    if (!adr) return null;

    return { task: first, adr };
  }
}
