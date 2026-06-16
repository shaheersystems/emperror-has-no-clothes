import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { tool } from "ai";
import { z } from "zod";
import { resolveRepoPath } from "./sandbox.ts";

export const createFileTool = tool({
  description:
    "Create a new file (relative to repo root) with the given content, creating " +
    "parent directories as needed. Fails if the file already exists; use " +
    "edit_file to modify or overwrite an existing file.",
  inputSchema: z.object({
    path: z.string().describe("File path to create, relative to the repo root."),
    content: z
      .string()
      .default("")
      .describe("Content to write into the new file."),
  }),
  async execute({ path: relPath, content }) {
    const abs = resolveRepoPath(relPath);
    await mkdir(path.dirname(abs), { recursive: true });

    try {
      // `wx` fails if the path already exists, so we never clobber a file.
      await writeFile(abs, content, { encoding: "utf8", flag: "wx" });
      return { path: abs, action: "created_file" as const };
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "EEXIST") {
        return { path: abs, action: "file_already_exists" as const };
      }
      throw err;
    }
  },
});
