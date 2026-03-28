import {
  CompleteTaskUseCase,
  CreateADRUseCase,
  CreateTaskUseCase,
  GetContextUseCase,
  GetHistoryUseCase,
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
  getHistory: GetHistoryUseCase;
}

export function createContainer(realmRoot: string): Container {
  const git = new GitAdapter();
  const repo = new FsRealmRepository(realmRoot, git);

  return {
    realmRoot,
    repo,
    createADR: new CreateADRUseCase(repo),
    createTask: new CreateTaskUseCase(repo),
    completeTask: new CompleteTaskUseCase(repo),
    getNext: new GetNextUseCase(repo),
    getContext: new GetContextUseCase(repo),
    getHistory: new GetHistoryUseCase(repo),
  };
}
