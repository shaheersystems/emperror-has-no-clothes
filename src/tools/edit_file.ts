import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { asString, asStringOr } from "./args.ts";
import { resolveRepoPath } from "./path_sandbox.ts";
import type { ToolDefinition } from "./types.ts";

export const editFileTool: ToolDefinition = {
  name: "edit_file",
  description:
    "Replace first occurrence of old_str with new_str in file. If old_str is empty, create/overwrite file with new_str.",
  argsSchema: `{"path":"string (file path relative to repo root)","old_str":"string","new_str":"string"}`,
  async run(args) {
    const relPath = asString(args.path, "path");
    const oldStr = asStringOr(args.old_str, "old_str", "");
    const newStr = asStringOr(args.new_str, "new_str", "");

    const abs = resolveRepoPath(relPath);
    await mkdir(path.dirname(abs), { recursive: true });

    if (oldStr === "") {
      await writeFile(abs, newStr, "utf8");
      return { path: abs, action: "created_file" };
    }

    let original = "";
    try {
      original = await readFile(abs, "utf8");
    } catch {
      return { path: abs, action: "file_not_found" };
    }

    const idx = original.indexOf(oldStr);
    if (idx === -1) {
      return { path: abs, action: "old_str not found" };
    }

    const edited = original.slice(0, idx) + newStr + original.slice(idx + oldStr.length);
    await writeFile(abs, edited, "utf8");
    return { path: abs, action: "edited" };
  },
};

