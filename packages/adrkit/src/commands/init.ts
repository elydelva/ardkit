import * as fs from "node:fs/promises";
import * as path from "node:path";
import {
  ADRKIT_DIR,
  CONFIG_FILE,
  MD_EXT,
  STATE_FILE,
  TEMPLATES_DIR,
  writeADRConfig,
} from "@adrkit/fs";

const ADR_TEMPLATE = `---
id: "{{id}}"
title: "{{title}}"
status: proposed
author: "{{author}}"
phase: ""
tags: []
dependsOn: []
relatedTo: []
conflictsWith: []
supersedes: ~
rules: []
---

# {{title}}

## Context

<!-- Why does this decision need to be made? -->

## Decision

<!-- What was decided? -->

## Consequences

<!-- What are the trade-offs? -->
`;

const TASK_TEMPLATE = `---
id: "{{id}}"
adrId: "{{adrId}}"
title: "{{title}}"
status: todo
author: "{{author}}"
assignee: ~
estimatedHours: ~
gates: []
rules: []
---

<!-- Task description -->
`;

export async function runInit(realmRoot: string): Promise<void> {
  const adrKitDir = path.join(realmRoot, ADRKIT_DIR);
  const templatesDir = path.join(adrKitDir, TEMPLATES_DIR);

  await fs.mkdir(adrKitDir, { recursive: true });
  await fs.mkdir(templatesDir, { recursive: true });

  const stateFile = path.join(adrKitDir, STATE_FILE);
  try {
    await fs.access(stateFile);
  } catch {
    await fs.writeFile(stateFile, JSON.stringify({ adr: 0, task: 0, trace: 0 }, null, 2), "utf-8");
  }

  await fs.writeFile(path.join(templatesDir, `adr${MD_EXT}`), ADR_TEMPLATE, "utf-8");
  await fs.writeFile(path.join(templatesDir, `task${MD_EXT}`), TASK_TEMPLATE, "utf-8");

  const configPath = path.join(realmRoot, CONFIG_FILE);
  try {
    await fs.access(configPath);
    console.log("✓ .adrconfig already exists, skipping");
  } catch {
    await writeADRConfig(realmRoot, {
      idFormat: "ADR-XXXX",
      types: ["tech-choice", "process", "architecture"],
      templates: {},
    });
  }

  console.log(`✓ Initialized ${ADRKIT_DIR}/`);
  console.log(`  ${ADRKIT_DIR}/${STATE_FILE}`);
  console.log(`  ${ADRKIT_DIR}/${TEMPLATES_DIR}/adr${MD_EXT}`);
  console.log(`  ${ADRKIT_DIR}/${TEMPLATES_DIR}/task${MD_EXT}`);
  console.log(`  ${CONFIG_FILE}`);
  console.log("");
  console.log('Next: adrkit new --title "My first ADR" --type tech-choice');
}
