import {
  CompleteTaskUseCase,
  CreateADRUseCase,
  CreateTaskUseCase,
  GetContextUseCase,
  GetNextUseCase,
  type IRealmRepository,
} from "@adrkit/core";
import { FsRealmRepository } from "@adrkit/fs";
import { GitAdapter } from "@adrkit/git";

export interface Container {
  realmRoot: string;
  repo: IRealmRepository;
  createADR: CreateADRUseCase;
  createTask: CreateTaskUseCase;
  completeTask: CompleteTaskUseCase;
  getNext: GetNextUseCase;
  getContext: GetContextUseCase;
}

export function createContainer(realmRoot: string): Container {
  const git = new GitAdapter();
  const repo = new FsRealmRepository(realmRoot, git);

  return {
    realmRoot,
    repo,
    createADR: new CreateADRUseCase(repo, git),
    createTask: new CreateTaskUseCase(repo, git),
    completeTask: new CompleteTaskUseCase(repo, git),
    getNext: new GetNextUseCase(repo),
    getContext: new GetContextUseCase(repo),
  };
}
