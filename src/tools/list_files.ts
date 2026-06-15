import { readdir } from "node:fs/promises";
import path from "node:path";
import { asStringOr } from "./args.ts";
import { resolveRepoPath } from "./path_sandbox.ts";
import type { ToolDefinition } from "./types.ts";

export const listFilesTool: ToolDefinition = {
  name: "list_files",
  description: "List files and directories in a given directory (relative to repo root).",
  argsSchema: `{"path":"string (dir path relative to repo root)"}`,
  async run(args) {
    const dirPath = asStringOr(args.path, "path", ".");
    const abs = resolveRepoPath(dirPath);
    const entries = await readdir(abs, { withFileTypes: true });
    const files = entries
      .map((ent) => ({
        filename: ent.name,
        type: ent.isDirectory() ? "dir" : "file",
      }))
      .sort((a, b) => a.filename.localeCompare(b.filename));

    return { path: path.resolve(abs), files };
  },
};

