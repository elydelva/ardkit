import * as fs from "node:fs/promises";
import * as path from "node:path";
import yaml from "js-yaml";

export interface ADRConfig {
  idFormat: string;
  types: string[];
  templates: Record<string, string>;
}

const DEFAULT_CONFIG: ADRConfig = {
  idFormat: "ADR-XXXX",
  types: ["tech-choice", "process", "architecture"],
  templates: {},
};

export async function readADRConfig(realmRoot: string): Promise<ADRConfig> {
  const configPath = path.join(realmRoot, ".adrconfig");
  try {
    const raw = await fs.readFile(configPath, "utf-8");
    const parsed = yaml.load(raw);
    if (typeof parsed !== "object" || parsed === null) return { ...DEFAULT_CONFIG };
    const p = parsed as Record<string, unknown>;
    return {
      idFormat: typeof p.idFormat === "string" ? p.idFormat : DEFAULT_CONFIG.idFormat,
      types: Array.isArray(p.types)
        ? (p.types as string[]).filter((v) => typeof v === "string")
        : DEFAULT_CONFIG.types,
      templates:
        typeof p.templates === "object" && p.templates !== null
          ? (p.templates as Record<string, string>)
          : DEFAULT_CONFIG.templates,
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export async function writeADRConfig(realmRoot: string, config: ADRConfig): Promise<void> {
  const configPath = path.join(realmRoot, ".adrconfig");
  await fs.writeFile(configPath, yaml.dump(config), "utf-8");
}
