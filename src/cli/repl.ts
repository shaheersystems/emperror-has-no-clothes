import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";
import { CodingAgent, type AgentEvent } from "../ai/agent.ts";

function renderEvent(event: AgentEvent): void {
  switch (event.type) {
    case "text":
      stdout.write(event.text);
      break;
    case "tool-call":
      stdout.write(`\n[tool] ${event.toolName} ${JSON.stringify(event.input)}\n`);
      break;
    case "tool-result":
      stdout.write(`[result] ${event.toolName} ${JSON.stringify(event.output)}\n`);
      break;
    case "error": {
      const message =
        event.error instanceof Error ? event.error.message : String(event.error);
      stdout.write(`\n[error] ${message}\n`);
      break;
    }
  }
}

/**
 * Run the interactive read-eval-print loop. Each user line is handed to the
 * agent, whose streamed events are rendered to the terminal.
 */
export async function startRepl(): Promise<void> {
  const rl = createInterface({ input: stdin, output: stdout });
  const agent = new CodingAgent();

  stdout.write("Coding agent ready. Type 'exit' or 'quit' to leave.\n");

  while (true) {
    let userInput: string;
    try {
      userInput = (await rl.question("\nYou: ")).trim();
    } catch {
      // stdin closed (EOF / Ctrl+D / end of piped input): exit gracefully.
      break;
    }
    const command = userInput.toLowerCase();
    if (command === "exit" || command === "quit") break;
    if (!userInput) continue;

    stdout.write("Assistant: ");
    try {
      await agent.send(userInput, renderEvent);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      stdout.write(`\n[error] ${message}\n`);
    }
    stdout.write("\n");
  }

  rl.close();
}
