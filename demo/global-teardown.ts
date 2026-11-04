import { STATE_FILE, terminalState, tmux } from "./lib";
import { existsSync } from "fs";

export default async function globalTeardown(): Promise<void> {
  if (existsSync(STATE_FILE)) {
    try {
      process.kill(terminalState().ttydPid);
    } catch {
      // already gone
    }
  }
  try {
    tmux("kill-server");
  } catch {
    // already gone
  }
}
