import type { ToolDefinition } from "./types.ts";
import { editFileTool } from "./edit_file.ts";
import { listFilesTool } from "./list_files.ts";
import { readFileTool } from "./read_file.ts";

export const TOOL_REGISTRY: Record<string, ToolDefinition> = {
  [readFileTool.name]: readFileTool,
  [listFilesTool.name]: listFilesTool,
  [editFileTool.name]: editFileTool,
};

export function renderToolsForPrompt(): string {
  const tools = Object.values(TOOL_REGISTRY);
  return tools
    .map(
      (t) =>
        `TOOL\n===\nName: ${t.name}\nDescription: ${t.description}\nArgs (JSON): ${t.argsSchema}\n===============`
    )
    .join("\n");
}

