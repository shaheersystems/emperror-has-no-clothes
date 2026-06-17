import { mkdir } from "node:fs/promises";
import { tool } from "ai";
import { z } from "zod";
import { resolveRepoPath } from "./sandbox.ts";

export const createDirectoryTool = tool({
  description:
    "Create a new directory (relative to repo root), including any missing " +
    "parent directories. Succeeds without changes if the directory already " +
    "exists. Use create_file to create files.",
  inputSchema: z.object({
    path: z
      .string()
      .describe("Directory path to create, relative to the repo root."),
  }),
  async execute({ path: relPath }) {
    const abs = resolveRepoPath(relPath);

    // `recursive: true` creates parent directories and does not error if the
    // target already exists, so creating an existing directory is a no-op.
    const created = await mkdir(abs, { recursive: true });
    return {
      path: abs,
      action: created ? ("created_directory" as const) : ("already_exists" as const),
    };
  },
});
