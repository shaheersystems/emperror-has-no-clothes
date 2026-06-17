import type { ToolSet } from "ai";
import { createDirectoryTool } from "./create-directory.ts";
import { createFileTool } from "./create-file.ts";
import { editFileTool } from "./edit-file.ts";
import { listFilesTool } from "./list-files.ts";
import { readFileTool } from "./read-file.ts";

/**
 * The set of tools exposed to the model. The keys are the tool names the model
 * sees; add a new tool by importing it and adding an entry here.
 */
export const tools = {
  read_file: readFileTool,
  list_files: listFilesTool,
  create_file: createFileTool,
  create_directory: createDirectoryTool,
  edit_file: editFileTool,
} satisfies ToolSet;
