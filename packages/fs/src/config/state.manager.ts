import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { CounterKey, RealmState } from "@adrkit/core";
import { ADRKIT_DIR, STATE_FILE } from "../constants.js";

function stateFilePath(realmRoot: string): string {
  return path.join(realmRoot, ADRKIT_DIR, STATE_FILE);
}

async function readStateRaw(realmRoot: string): Promise<Record<string, number>> {
  try {
    const raw = await fs.readFile(stateFilePath(realmRoot), "utf-8");
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null) {
      return parsed as Record<string, number>;
    }
    return {};
  } catch {
    return {};
  }
}

async function writeStateRaw(realmRoot: string, state: Record<string, number>): Promise<void> {
  const filePath = stateFilePath(realmRoot);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(state, null, 2), "utf-8");
}

export async function getState(realmRoot: string): Promise<RealmState> {
  const raw = await readStateRaw(realmRoot);
  return {
    counters: {
      adr: raw.adr ?? 0,
      task: raw.task ?? 0,
      trace: raw.trace ?? 0,
    },
  };
}

export async function incrementCounter(realmRoot: string, entity: CounterKey): Promise<number> {
  const raw = await readStateRaw(realmRoot);
  const current = raw[entity] ?? 0;
  const next = current + 1;
  raw[entity] = next;
  await writeStateRaw(realmRoot, raw);
  return next;
}
