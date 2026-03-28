import { ADR } from "../entities/adr.js";
import type { CreateADRParams } from "../entities/adr.js";
import { Trace } from "../entities/trace.js";
import type { IGitAdapter } from "../ports/git.adapter.js";
import type { IRealmRepository } from "../ports/realm.repository.js";
import { ADRId } from "../value-objects/adr-id.js";
import { TraceId } from "../value-objects/trace-id.js";

type CreateADRInput = Omit<CreateADRParams, "id"> & {
  actor?: string;
  actorType?: "human" | "agent";
};

export class CreateADRUseCase {
  constructor(
    private readonly repo: IRealmRepository,
    private readonly git?: IGitAdapter
  ) {}

  async execute(input: CreateADRInput): Promise<ADR> {
    const counter = await this.repo.incrementCounter("adr");
    const id = ADRId.generate(counter);

    const adr = ADR.create({ ...input, id });
    await this.repo.saveADR(adr);

    const traceCounter = await this.repo.incrementCounter("trace");
    const trace = Trace.create({
      id: TraceId.generate(traceCounter),
      adrId: id,
      actor: input.actor ?? input.author,
      actorType: input.actorType ?? "human",
      event: "adr_created",
    });
    await this.repo.appendTrace(trace);

    if (this.git) {
      await this.git.stage([`adrs/${id.toString()}`]);
    }

    return adr;
  }
}
