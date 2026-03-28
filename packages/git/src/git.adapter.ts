import type { IGitAdapter } from "@adrkit/core";
import { GitCommandError } from "./errors/index.js";

export class GitAdapter implements IGitAdapter {
  async stage(paths: string[]): Promise<void> {
    if (paths.length === 0) return;

    const proc = Bun.spawn(["git", "add", "--", ...paths], {
      stdout: "ignore",
      stderr: "pipe",
    });

    const exitCode = await proc.exited;

    if (exitCode !== 0) {
      const stderrText = await new Response(proc.stderr).text();
      throw new GitCommandError(`git add -- ${paths.join(" ")}`, exitCode, stderrText);
    }
  }

  async isRepo(): Promise<boolean> {
    const proc = Bun.spawn(["git", "rev-parse", "--is-inside-work-tree"], {
      stdout: "ignore",
      stderr: "ignore",
    });

    const exitCode = await proc.exited;
    return exitCode === 0;
  }
}
