import type { ToolInvocation } from "../tools/types.ts";

export function extractToolInvocations(text: string): ToolInvocation[] {
  const invocations: ToolInvocation[] = [];
  for (const rawLine of text.split(/\r?\n/g)) {
    const line = rawLine.trim();
    if (!line.startsWith("tool:")) continue;

    const after = line.slice("tool:".length).trim();
    const openIdx = after.indexOf("(");
    const closeIdx = after.lastIndexOf(")");
    if (openIdx === -1 || closeIdx === -1 || closeIdx <= openIdx) continue;

    const name = after.slice(0, openIdx).trim();
    const jsonStr = after.slice(openIdx + 1, closeIdx).trim();
    if (!name) continue;

    try {
      const args = jsonStr === "" ? {} : (JSON.parse(jsonStr) as Record<string, unknown>);
      invocations.push({ name, args });
    } catch {
      // ignore malformed JSON tool line
    }
  }
  return invocations;
}

