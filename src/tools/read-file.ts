import { readFile } from "node:fs/promises";
import { tool } from "ai";
import { z } from "zod";
import { resolveRepoPath } from "./sandbox.ts";

export const readFileTool = tool({
  description: "Read the full contents of a file (relative to repo root).",
  inputSchema: z.object({
    filename: z.string().describe("Path to the file, relative to the repo root."),
  }),
  async execute({ filename }) {
    const abs = resolveRepoPath(filename);
    try {
      const content = await readFile(abs, "utf8");
      return { file_path: abs, content };
    } catch {
      return { file_path: abs, action: "file_not_found" as const };
    }
  },
});
