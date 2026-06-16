import { readdir } from "node:fs/promises";
import path from "node:path";
import { tool } from "ai";
import { z } from "zod";
import { resolveRepoPath } from "./sandbox.ts";

export const listFilesTool = tool({
  description:
    "List files and directories in a given directory (relative to repo root).",
  inputSchema: z.object({
    path: z
      .string()
      .default(".")
      .describe("Directory path, relative to the repo root. Defaults to the root."),
  }),
  async execute({ path: dirPath }) {
    const abs = resolveRepoPath(dirPath);
    const entries = await readdir(abs, { withFileTypes: true });
    const files = entries
      .map((ent) => ({
        filename: ent.name,
        type: ent.isDirectory() ? ("dir" as const) : ("file" as const),
      }))
      .sort((a, b) => a.filename.localeCompare(b.filename));

    return { path: path.resolve(abs), files };
  },
});
