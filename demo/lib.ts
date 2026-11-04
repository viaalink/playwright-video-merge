/**
 * Shared by the film's setup, teardown and storyboard: where the shop workspace
 * lives, and the terminal the film types into (tmux on its own socket, shown
 * in the browser by ttyd), so it never touches your own tmux sessions.
 */
import { execFileSync } from "child_process";
import { readFileSync } from "fs";
import { resolve } from "path";

export const REPO = resolve(__dirname, "..");
export const WORKSPACE = resolve(REPO, "local/video/workspace");
export const STATE_FILE = resolve(REPO, "local/video/terminal.json");
export const TMUX_SOCKET = "pvm-film";
export const TMUX_SESSION = "shop";

export interface TerminalState {
  url: string;
  ttydPid: number;
}

export function terminalState(): TerminalState {
  return JSON.parse(readFileSync(STATE_FILE, "utf8")) as TerminalState;
}

export function tmux(...args: string[]): string {
  return execFileSync("tmux", ["-L", TMUX_SOCKET, ...args], { encoding: "utf8" });
}

/** What the terminal shows now, including its scrollback. */
export function screen(): string {
  return tmux("capture-pane", "-p", "-J", "-S", "-500", "-t", TMUX_SESSION);
}

/** Wait until the terminal shows `text` (checks run on the real output, not on pixels). */
export async function waitForScreen(text: string | RegExp, timeoutMs = 60000): Promise<void> {
  const until = Date.now() + timeoutMs;
  for (;;) {
    const now = screen();
    if (typeof text === "string" ? now.includes(text) : text.test(now)) return;
    if (Date.now() > until) throw new Error(`terminal never showed ${text}; it shows:\n${now}`);
    await new Promise((r) => setTimeout(r, 250));
  }
}
