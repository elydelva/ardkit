import { spawn } from "node:child_process";
import type { IGitAdapter } from "@adrkit/core";
import { GitCommandError } from "./errors/index.js";

function run(args: string[]): Promise<{ exitCode: number; stderr: string }> {
  return new Promise((resolve) => {
    const stderrChunks: Buffer[] = [];
    const proc = spawn("git", args, { stdio: ["ignore", "ignore", "pipe"] });
    proc.stderr.on("data", (chunk: Buffer) => stderrChunks.push(chunk));
    proc.on("close", (code) => {
      resolve({ exitCode: code ?? 1, stderr: Buffer.concat(stderrChunks).toString() });
    });
  });
}

export class GitAdapter implements IGitAdapter {
  async stage(paths: string[]): Promise<void> {
    if (paths.length === 0) return;

    const { exitCode, stderr } = await run(["add", "--", ...paths]);

    if (exitCode !== 0) {
      throw new GitCommandError(`git add -- ${paths.join(" ")}`, exitCode, stderr);
    }
  }

  async isRepo(): Promise<boolean> {
    const { exitCode } = await run(["rev-parse", "--is-inside-work-tree"]);
    return exitCode === 0;
  }
}
