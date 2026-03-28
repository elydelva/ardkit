import { ADR, Trace } from "../../entities/index.js";
import type { CreateADRParams } from "../../entities/index.js";
import type { IGitAdapter, IRealmRepository } from "../../ports/index.js";
import { ADRId, TraceId } from "../../value-objects/index.js";

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
