export type ToolInvocation = {
  name: string;
  args: Record<string, unknown>;
};

export type ToolResult = Record<string, unknown>;

export type ToolDefinition = {
  name: string;
  description: string;
  argsSchema: string;
  run: (args: Record<string, unknown>) => Promise<ToolResult>;
};

