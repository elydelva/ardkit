#!/usr/bin/env node
import { buildCLI } from "./cli.js";

const program = buildCLI();

program.parseAsync(process.argv).catch((err: unknown) => {
  if (err instanceof Error) {
    console.error(`Error: ${err.message}`);
  } else {
    console.error("An unexpected error occurred");
  }
  process.exit(1);
});
