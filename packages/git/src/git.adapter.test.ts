import { describe, expect, it } from "bun:test";
import { GitAdapter } from "./git.adapter.js";

describe("GitAdapter", () => {
  const adapter = new GitAdapter();

  describe("isRepo()", () => {
    it("returns true when run inside a git repository", async () => {
      // The test process runs inside the ardkit monorepo, which is a git repo.
      const result = await adapter.isRepo();
      expect(result).toBe(true);
    });
  });

  describe("stage()", () => {
    it("resolves without error when paths array is empty", async () => {
      await expect(adapter.stage([])).resolves.toBeUndefined();
    });
  });
});
