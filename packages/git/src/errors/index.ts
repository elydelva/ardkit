export class GitCommandError extends Error {
  constructor(
    public readonly command: string,
    public readonly exitCode: number,
    public readonly stderr: string
  ) {
    super(`Git command failed (exit ${exitCode}): ${command}\n${stderr}`);
    this.name = "GitCommandError";
  }
}
