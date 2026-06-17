import path from "node:path";
import chalk from "chalk";

/**
 * Presentation layer for the CLI: colors, the whimsical "working" verbs, and
 * the logic that turns raw tool calls/results into human-readable status lines.
 * Keeping it here means the REPL stays focused on control flow.
 */

/** Brand palette, centralized so the look can be retuned in one place. */
export const palette = {
  brand: chalk.hex("#c084fc"), // soft violet
  accent: chalk.hex("#22d3ee"), // cyan
  user: chalk.hex("#34d399"), // green
  assistant: chalk.white,
  border: chalk.hex("#6b7280"), // subtle gray box edges
  muted: chalk.dim,
  ok: chalk.green,
  warn: chalk.yellow,
  err: chalk.red,
};

/**
 * Cute, whimsical present-participles shown while the agent is thinking. One is
 * picked at random each time the agent returns to "working", e.g. "Ziggagging…".
 */
const WHIMSICAL_VERBS = [
  "Ziggagging",
  "Noodling",
  "Bamboozling",
  "Conjuring",
  "Percolating",
  "Wobbling",
  "Marinating",
  "Frolicking",
  "Tinkering",
  "Galumphing",
  "Befuddling",
  "Kerfuffling",
  "Doodling",
  "Discombobulating",
  "Snazzifying",
  "Wrangling",
  "Flummoxing",
  "Razzmatazzing",
  "Bedazzling",
  "Hornswoggling",
  "Skedaddling",
  "Canoodling",
  "Mulling",
  "Yak-shaving",
  "Jitterbugging",
  "Flibbertigibbeting",
  "Whirring",
  "Scheming",
  "Pondering",
  "Brewing",
];

/** A random whimsical status line such as "Bamboozling…". */
export function whimsy(): string {
  const verb = WHIMSICAL_VERBS[Math.floor(Math.random() * WHIMSICAL_VERBS.length)];
  return `${palette.brand(verb)}${palette.muted("…")}`;
}

/** Shorten an absolute tool path to something repo-relative and readable. */
function prettyPath(p: unknown): string {
  if (typeof p !== "string" || p.length === 0) return "";
  const rel = path.relative(process.cwd(), p);
  // Fall back to the original if relativizing escaped the repo or emptied it.
  return rel && !rel.startsWith("..") ? rel : p;
}

/** Present-tense status shown on the spinner while a tool is running. */
export function describeToolCall(toolName: string, input: unknown): string {
  const arg = (input ?? {}) as Record<string, unknown>;
  switch (toolName) {
    case "read_file":
      return `Reading ${chalk.bold(String(arg.filename ?? ""))}`;
    case "list_files":
      return `Listing ${chalk.bold(String(arg.path ?? "."))}`;
    case "create_file":
      return `Creating ${chalk.bold(String(arg.path ?? ""))}`;
    case "create_directory":
      return `Creating directory ${chalk.bold(String(arg.path ?? ""))}`;
    case "edit_file":
      return `Editing ${chalk.bold(String(arg.path ?? ""))}`;
    default:
      return `Running ${chalk.bold(toolName)}`;
  }
}

/** Outcome of a finished tool call, ready to render with a check or warning. */
export interface ToolOutcome {
  ok: boolean;
  text: string;
}

/** Past-tense summary of a completed tool call, derived from its result. */
export function describeToolResult(toolName: string, output: unknown): ToolOutcome {
  const out = (output ?? {}) as Record<string, unknown>;
  const target = chalk.bold(prettyPath(out.file_path ?? out.path));
  const action = typeof out.action === "string" ? out.action : undefined;

  // Failure actions returned by the tools (see src/tools/*). Anything else is
  // treated as success.
  switch (action) {
    case "file_not_found":
      return { ok: false, text: `Couldn't find ${target}` };
    case "old_str not found":
      return { ok: false, text: `No matching text to edit in ${target}` };
    case "file_already_exists":
      return { ok: false, text: `${target} already exists` };
  }

  switch (toolName) {
    case "read_file":
      return { ok: true, text: `Read ${target}` };
    case "list_files": {
      const count = Array.isArray(out.files) ? out.files.length : undefined;
      const suffix = count === undefined ? "" : palette.muted(` (${count} entries)`);
      return { ok: true, text: `Listed ${target}${suffix}` };
    }
    case "create_file":
      return { ok: true, text: `Created ${target}` };
    case "create_directory":
      return { ok: true, text: `Created directory ${target}` };
    case "edit_file":
      return { ok: true, text: `Edited ${target}` };
    default:
      return { ok: true, text: `Ran ${chalk.bold(toolName)}` };
  }
}

/** The startup banner. */
export function banner(model: string): string {
  const title = palette.brand.bold("✦ coding agent");
  const sub = palette.muted(`model ${model} · type `) + palette.accent("exit") +
    palette.muted(" or ") + palette.accent("quit") + palette.muted(" to leave");
  return `\n${title}\n${sub}\n`;
}
