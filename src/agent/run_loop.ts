import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { callOpenAI, type ChatMessage } from "../llm/openai.ts";
import { extractToolInvocations } from "../protocol/tool_parser.ts";
import { TOOL_REGISTRY, renderToolsForPrompt } from "../tools/registry.ts";

// Safety cap on consecutive tool round-trips per user turn, so a model that
// keeps emitting tool calls can never spin forever.
const MAX_TOOL_STEPS = 25;

function buildSystemPrompt(): string {
  return [
    "You are a coding assistant with access to local tools.",
    "",
    "Your job is to help the user complete software tasks (answer questions, write code, debug, refactor, explain, etc.).",
    "Be correct, concise, and actionable. Ask clarifying questions only when required to avoid being wrong.",
    "",
    "## Tool calling protocol (STRICT)",
    "You may request tools by replying with one or more lines in exactly this format (one per line):",
    "tool: TOOL_NAME({\"arg\":\"value\"})",
    "",
    "Tool call rules:",
    "- Output ONLY tool lines when calling tools (no extra prose before/after).",
    "- Use compact JSON with double quotes for all keys and strings.",
    "- Provide an object as arguments ({}). Do not omit required args.",
    "- If multiple tools are needed, output one 'tool:' line per invocation.",
    "- Call tools only from the 'Available tools' list below. Never invent tool names.",
    "- If no tool is needed, reply normally and do not output any 'tool:' lines.",
    "",
    "## How to use tools effectively",
    "- Prefer tools when they increase correctness: inspecting files/state, running commands, or gathering exact outputs.",
    "- Don't guess results you could obtain via a tool; use the tool instead.",
    "- Minimize tool calls: batch independent steps, but keep each call purposeful.",
    "",
    "## Tool results",
    "After a tool call, the system will append one or more messages like:",
    "tool_result({\"name\":\"...\",\"action\":\"...\", ...})",
    "When you receive tool_result(...):",
    "- Treat it as the ground truth result of the tool execution.",
    "- Continue the task from that new state; decide whether more tools are needed.",
    "- If a tool returned an error, recover: adjust inputs, try an alternative approach, or explain next steps.",
    "",
    "Available tools:",
    renderToolsForPrompt(),
  ].join("\n");
}

async function runToolsAndAppendResults(
  conversation: ChatMessage[],
  toolText: string
): Promise<boolean> {
  const invocations = extractToolInvocations(toolText);
  if (invocations.length === 0) return false;

  for (const inv of invocations) {
    const tool = TOOL_REGISTRY[inv.name];
    let result: Record<string, unknown>;
    try {
      if (!tool) {
        result = { name: inv.name, action: "unknown_tool" };
      } else {
        result = await tool.run(inv.args);
      }
    } catch (err) {
      result = {
        name: inv.name,
        action: "error",
        error: err instanceof Error ? err.message : String(err),
      };
    }

    conversation.push({
      role: "user",
      content: `tool_result(${JSON.stringify(result)})`,
    });
  }

  return true;
}

export async function runAgentLoop(): Promise<void> {
  const rl = createInterface({ input: stdin, output: stdout });

  const conversation: ChatMessage[] = [
    {
      role: "system",
      content: buildSystemPrompt(),
    },
  ];

  while (true) {
    const userInput = await rl.question("You: ");
    const trimmed = userInput.trim();
    if (trimmed.toLowerCase() === "exit" || trimmed.toLowerCase() === "quit") break;
    if (!trimmed) continue;

    conversation.push({ role: "user", content: trimmed });

    for (let step = 0; step < MAX_TOOL_STEPS; step++) {
      let assistantText = "";
      try {
        assistantText = await callOpenAI(conversation);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        stdout.write(`Assistant: ${msg}\n`);
        break;
      }

      // Always record the assistant turn so the model sees its own tool calls
      // alongside the tool_result messages on the next request.
      conversation.push({ role: "assistant", content: assistantText });

      const didTools = await runToolsAndAppendResults(conversation, assistantText);
      if (!didTools) {
        stdout.write(`Assistant: ${assistantText}\n`);
        break;
      }

      if (step === MAX_TOOL_STEPS - 1) {
        stdout.write(
          `Assistant: stopped after ${MAX_TOOL_STEPS} tool steps without a final answer.\n`
        );
      }
    }
  }

  rl.close();
}

