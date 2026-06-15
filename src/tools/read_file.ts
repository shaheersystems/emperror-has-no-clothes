import { readFile } from "node:fs/promises";
import { asString } from "./args.ts";
import { resolveRepoPath } from "./path_sandbox.ts";
import type { ToolDefinition } from "./types.ts";

export const readFileTool: ToolDefinition = {
  name: "read_file",
  description: "Read the full contents of a file (relative to repo root).",
  argsSchema: `{"filename":"string (path relative to repo root)"}`,
  async run(args) {
    const filename = asString(args.filename, "filename");
    const abs = resolveRepoPath(filename);
    try {
      const content = await readFile(abs, "utf8");
      return { file_path: abs, content };
    } catch {
      return { file_path: abs, action: "file_not_found" };
    }
  },
};

