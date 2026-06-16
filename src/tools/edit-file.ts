import { readFile, writeFile } from "node:fs/promises";
import { tool } from "ai";
import { z } from "zod";
import { resolveRepoPath } from "./sandbox.ts";

export const editFileTool = tool({
  description:
    "Replace the first occurrence of old_str with new_str in an existing file. " +
    "Use create_file to create a new file.",
  inputSchema: z.object({
    path: z.string().describe("File path, relative to the repo root."),
    old_str: z
      .string()
      .min(1)
      .describe("Existing text to replace. Must match exactly and be non-empty."),
    new_str: z.string().default("").describe("Replacement text."),
  }),
  async execute({ path: relPath, old_str: oldStr, new_str: newStr }) {
    const abs = resolveRepoPath(relPath);

    let original = "";
    try {
      original = await readFile(abs, "utf8");
    } catch {
      return { path: abs, action: "file_not_found" as const };
    }

    const idx = original.indexOf(oldStr);
    if (idx === -1) {
      return { path: abs, action: "old_str not found" as const };
    }

    const edited =
      original.slice(0, idx) + newStr + original.slice(idx + oldStr.length);
    await writeFile(abs, edited, "utf8");
    return { path: abs, action: "edited" as const };
  },
});
