import { startRepl } from "./cli/repl.ts";

/**
 * Composition root. Importing `./config/env.ts` (transitively, via the agent)
 * validates configuration at startup, so a misconfigured environment fails fast
 * with a clear message before the REPL starts.
 */
export async function main(): Promise<void> {
  await startRepl();
}
