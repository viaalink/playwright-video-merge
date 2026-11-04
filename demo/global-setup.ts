/**
 * Make the film's world, fresh on every run:
 *
 * 1. local/video/workspace/ is a copy of demo/shop with its own node_modules:
 *    @playwright/test and this repo as it is now (npm pack), or the release on
 *    npm with PVM_FROM_NPM=1.
 * 2. A tmux session on its own socket, in that workspace, with a short prompt.
 * 3. ttyd shows that session in the browser, writable, in a camera-ready theme.
 */
import { execFileSync, execSync, spawn } from "child_process";
import { cpSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "fs";
import { createServer } from "net";
import { resolve } from "path";
import { REPO, STATE_FILE, TMUX_SESSION, TMUX_SOCKET, WORKSPACE, tmux } from "./lib";

function freePort(): Promise<number> {
  return new Promise((ok, fail) => {
    const srv = createServer();
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address() as { port: number };
      srv.close(() => ok(port));
    });
    srv.on("error", fail);
  });
}

export default async function globalSetup(): Promise<void> {
  rmSync(WORKSPACE, { recursive: true, force: true });
  mkdirSync(WORKSPACE, { recursive: true });
  cpSync(resolve(REPO, "demo/shop"), WORKSPACE, { recursive: true });

  const sh = (cmd: string, cwd = WORKSPACE) => execSync(cmd, { cwd, stdio: "inherit" });
  if (process.env["PVM_FROM_NPM"] === "1") {
    sh("npm install --no-audit --no-fund");
  } else {
    sh("npm run build", REPO);
    const packDir = resolve(REPO, "local/video/pack");
    rmSync(packDir, { recursive: true, force: true });
    mkdirSync(packDir, { recursive: true });
    sh(`npm pack --pack-destination ${packDir}`, REPO);
    const tgz = readdirSync(packDir).find((f) => f.endsWith(".tgz"));
    sh(`npm install --no-audit --no-fund @playwright/test@1.62.1 ${resolve(packDir, tgz!)}`);
  }

  try {
    tmux("kill-server");
  } catch {
    // no server yet
  }
  execFileSync("tmux", [
    "-L", TMUX_SOCKET, "-f", "/dev/null",
    "new-session", "-d", "-s", TMUX_SESSION, "-x", "96", "-y", "26", "-c", WORKSPACE,
    "env", "PS1=\\[\\e[1;33m\\]acme-shop\\[\\e[0m\\] $ ", "TERM=xterm-256color", "bash", "--norc", "--noprofile",
  ]);
  tmux("set", "-g", "status", "off");
  tmux("set", "-g", "history-limit", "5000");

  const port = await freePort();
  const theme = JSON.stringify({ background: "#0d1117", foreground: "#e6edf3", cursor: "#ffcf6e" });
  const ttyd = spawn(
    "ttyd",
    [
      "-p", String(port), "-i", "127.0.0.1", "-W",
      "-t", "fontSize=19", "-t", `theme=${theme}`, "-t", "disableLeaveAlert=true",
      "-t", "titleFixed=acme-shop",
      "tmux", "-L", TMUX_SOCKET, "attach", "-t", TMUX_SESSION,
    ],
    { stdio: "ignore", detached: true },
  );
  ttyd.unref();
  writeFileSync(STATE_FILE, JSON.stringify({ url: `http://127.0.0.1:${port}/`, ttydPid: ttyd.pid }));
  await new Promise((r) => setTimeout(r, 800));
}
