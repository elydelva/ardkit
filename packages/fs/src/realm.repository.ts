import * as fs from "node:fs/promises";
import * as path from "node:path";
import type {
  ADR,
  CounterKey,
  IGitAdapter,
  IRealmRepository,
  RealmState,
  Task,
  Trace,
  TraceFilter,
} from "@adrkit/core";
import type { ADRId, TaskId } from "@adrkit/core";
import { getState, incrementCounter } from "./config/state.manager.js";
import { ADRKIT_DIR, MD_EXT, TASKS_DIR, TRACES_DIR } from "./constants.js";
import { parseADR } from "./parsers/adr.parser.js";
import { parseTask } from "./parsers/task.parser.js";
import { serializeADR } from "./serializers/adr.serializer.js";
import { serializeTask } from "./serializers/task.serializer.js";
import { serializeTrace } from "./serializers/trace.serializer.js";

function adrDirName(id: ADRId): string {
  return id.toString();
}

function adrFilePath(realmRoot: string, id: ADRId): string {
  return path.join(realmRoot, ADRKIT_DIR, adrDirName(id), `${id.toString()}${MD_EXT}`);
}

function taskFilePath(realmRoot: string, adrId: ADRId, taskId: TaskId): string {
  return path.join(
    realmRoot,
    ADRKIT_DIR,
    adrDirName(adrId),
    TASKS_DIR,
    `${taskId.toString()}${MD_EXT}`
  );
}

function traceFilePath(realmRoot: string, adrId: ADRId, traceId: string): string {
  return path.join(realmRoot, ADRKIT_DIR, adrDirName(adrId), TRACES_DIR, `${traceId}${MD_EXT}`);
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export class FsRealmRepository implements IRealmRepository {
  constructor(
    private readonly realmRoot: string,
    private readonly git?: IGitAdapter
  ) {}

  private get adrKitDir(): string {
    return path.join(this.realmRoot, ADRKIT_DIR);
  }

  async findADR(id: ADRId): Promise<ADR | null> {
    const filePath = adrFilePath(this.realmRoot, id);
    if (!(await fileExists(filePath))) return null;
    const content = await fs.readFile(filePath, "utf-8");
    return parseADR(content);
  }

  async findAllADRs(): Promise<ADR[]> {
    const adrs: ADR[] = [];
    let entries: string[];
    try {
      const dirEntries = await fs.readdir(this.adrKitDir);
      entries = dirEntries;
    } catch {
      return [];
    }

    for (const entry of entries) {
      if (!entry.startsWith("ADR-")) continue;
      const mdPath = path.join(this.adrKitDir, entry, `${entry}${MD_EXT}`);
      if (!(await fileExists(mdPath))) continue;
      try {
        const content = await fs.readFile(mdPath, "utf-8");
        adrs.push(parseADR(content));
      } catch {
        // skip malformed files
      }
    }

    return adrs;
  }

  async saveADR(adr: ADR): Promise<void> {
    const filePath = adrFilePath(this.realmRoot, adr.id);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, serializeADR(adr), "utf-8");
    if (this.git) {
      await this.git.stage([filePath]);
    }
  }

  async findTask(id: TaskId): Promise<Task | null> {
    const adrs = await this.findAllADRs();
    for (const adr of adrs) {
      const filePath = taskFilePath(this.realmRoot, adr.id, id);
      if (await fileExists(filePath)) {
        const content = await fs.readFile(filePath, "utf-8");
        return parseTask(content, adr.id);
      }
    }
    return null;
  }

  async findTasksForADR(adrId: ADRId): Promise<Task[]> {
    const tasksDir = path.join(this.adrKitDir, adrDirName(adrId), TASKS_DIR);
    const tasks: Task[] = [];
    let entries: string[];
    try {
      entries = await fs.readdir(tasksDir);
    } catch {
      return [];
    }

    for (const entry of entries) {
      if (!entry.endsWith(MD_EXT)) continue;
      const filePath = path.join(tasksDir, entry);
      try {
        const content = await fs.readFile(filePath, "utf-8");
        tasks.push(parseTask(content, adrId));
      } catch {
        // skip malformed
      }
    }

    return tasks;
  }

  async findAllTasks(): Promise<Task[]> {
    const adrs = await this.findAllADRs();
    const allTasks: Task[] = [];
    for (const adr of adrs) {
      const tasks = await this.findTasksForADR(adr.id);
      allTasks.push(...tasks);
    }
    return allTasks;
  }

  async saveTask(task: Task): Promise<void> {
    const filePath = taskFilePath(this.realmRoot, task.adrId, task.id);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, serializeTask(task), "utf-8");
    if (this.git) {
      await this.git.stage([filePath]);
    }
  }

  async appendTrace(trace: Trace): Promise<void> {
    const filePath = traceFilePath(this.realmRoot, trace.adrId, trace.id.toString());
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, serializeTrace(trace), "utf-8");
    if (this.git) {
      await this.git.stage([filePath]);
    }
  }

  // v0.1: traces are written but not queryable
  async findTraces(_filter: TraceFilter): Promise<Trace[]> {
    return [];
  }

  async getState(): Promise<RealmState> {
    return getState(this.realmRoot);
  }

  async incrementCounter(entity: CounterKey): Promise<number> {
    return incrementCounter(this.realmRoot, entity);
  }
}
