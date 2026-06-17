import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";
import { palette } from "./theme.ts";

/**
 * A bordered, single-line input field in the style of modern AI coding CLIs
 * (Claude Code, Gemini CLI). It renders a rounded box whose right edge stays
 * aligned while you type, supports basic line editing, and horizontally scrolls
 * for input longer than the box.
 *
 * Returns the entered text, or `null` when the user asks to quit (Ctrl+C, or
 * Ctrl+D / EOF on an empty line).
 */
export async function readPrompt(placeholder = "Type a message…"): Promise<string | null> {
  // Without a TTY (piped input, tests) we can't do raw-mode editing, so fall
  // back to a plain readline prompt that still works end-to-end.
  if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
    return readPromptFallback();
  }
  return new Promise<string | null>((resolve) => {
    new BoxEditor(placeholder, resolve).run();
  });
}

const ESC = "\x1b[";
const up = (n: number) => `${ESC}${n}A`;
const down = (n: number) => `${ESC}${n}B`;
const toCol = (n: number) => `${ESC}${n}G`; // 1-based column

/** Visible width of the box: the full terminal width, minus a trailing column
 * so the right border never wraps. */
function boxWidth(): number {
  const cols = stdout.columns ?? 80;
  return Math.max(24, cols - 1);
}

class BoxEditor {
  private text = "";
  private cursor = 0; // caret index within `text`
  private scroll = 0; // first visible column of the body
  private rendered = false;

  constructor(
    private readonly placeholder: string,
    private readonly done: (value: string | null) => void
  ) {}

  run(): void {
    stdout.write("\n");
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    stdin.on("data", this.onData);
    this.render();
  }

  private finish(value: string | null): void {
    stdin.off("data", this.onData);
    stdin.setRawMode(false);
    stdin.pause();
    // Step below the box so the next output starts on a fresh line.
    stdout.write(`\r${down(1)}\n`);
    this.done(value);
  }

  private onData = (chunk: string): void => {
    let dirty = false;
    for (let i = 0; i < chunk.length; i++) {
      const ch = chunk[i]!;

      if (ch === "\x03") return this.finish(null); // Ctrl+C
      if (ch === "\r" || ch === "\n") return this.finish(this.text); // Enter
      if (ch === "\x04") {
        // Ctrl+D: quit only on an empty line, mirroring shell behaviour.
        if (this.text.length === 0) return this.finish(null);
        continue;
      }
      if (ch === "\x7f" || ch === "\b") {
        if (this.cursor > 0) {
          this.text = this.text.slice(0, this.cursor - 1) + this.text.slice(this.cursor);
          this.cursor--;
          dirty = true;
        }
        continue;
      }
      if (ch === "\x1b") {
        // Arrow keys / Home / End / Delete come as escape sequences.
        if (chunk[i + 1] === "[") {
          const code = chunk[i + 2];
          if (code === "D" && this.cursor > 0) this.cursor--;
          else if (code === "C" && this.cursor < this.text.length) this.cursor++;
          else if (code === "H") this.cursor = 0;
          else if (code === "F") this.cursor = this.text.length;
          else if (code === "3" && chunk[i + 3] === "~") {
            this.text = this.text.slice(0, this.cursor) + this.text.slice(this.cursor + 1);
            i++; // consume the trailing "~"
          }
          i += 2;
          dirty = true;
        }
        continue;
      }
      if (ch >= " ") {
        this.text = this.text.slice(0, this.cursor) + ch + this.text.slice(this.cursor);
        this.cursor++;
        dirty = true;
      }
    }
    if (dirty) this.render();
  };

  private render(): void {
    const W = boxWidth();
    const inner = W - 4; // body width between "│ " and " │"
    const marker = "› ";
    const empty = this.text.length === 0;
    const body = empty ? marker + this.placeholder : marker + this.text;
    const caretInBody = marker.length + this.cursor;

    // Keep the caret inside the visible window, scrolling horizontally if needed.
    if (caretInBody < this.scroll) this.scroll = caretInBody;
    else if (caretInBody > this.scroll + inner - 1) this.scroll = caretInBody - inner + 1;
    if (empty) this.scroll = 0;

    const window = body.slice(this.scroll, this.scroll + inner).padEnd(inner, " ");
    const caretCol = 2 + (caretInBody - this.scroll); // 0-based terminal column

    // Colorize: accent marker when it sits at the window start, dim placeholder.
    let painted: string;
    if (empty) {
      painted = palette.accent(window.slice(0, marker.length)) +
        palette.muted(window.slice(marker.length));
    } else if (this.scroll === 0) {
      painted = palette.accent(window.slice(0, marker.length)) +
        palette.assistant(window.slice(marker.length));
    } else {
      painted = palette.assistant(window);
    }

    const bar = palette.border("│");
    const content = `${bar} ${painted} ${bar}`;

    if (!this.rendered) {
      const dash = "─".repeat(W - 2);
      const top = palette.border(`╭${dash}╮`);
      const bottom = palette.border(`╰${dash}╯`);
      stdout.write(`${top}\n${content}\n${bottom}${up(1)}${toCol(caretCol + 1)}`);
      this.rendered = true;
    } else {
      stdout.write(`\r${content}${toCol(caretCol + 1)}`);
    }
  }
}

/** Minimal non-TTY prompt used when raw-mode editing isn't available. */
async function readPromptFallback(): Promise<string | null> {
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const line = await rl.question(palette.accent("\n› "));
    return line;
  } catch {
    return null; // EOF
  } finally {
    rl.close();
  }
}
