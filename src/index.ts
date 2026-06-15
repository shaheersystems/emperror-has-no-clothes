import { config as loadEnv } from "dotenv";
import { runAgentLoop } from "./agent/run_loop.ts";

export async function main() {
  loadEnv({
    path: ".env",
  });
  await runAgentLoop();
}

