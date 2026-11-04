/**
 * THE REEL STORYBOARD — from Playwright test videos to one demo reel.
 *
 * Films a real terminal (tmux in the shop workspace, shown by ttyd, see
 * global-setup.ts): the shop's four Playwright tests run, then
 * playwright-video-merge turns their five recordings into one reel, which is
 * then played. Every step checks the terminal's real output (tmux
 * capture-pane) or the player, so a broken tool fails the recording instead of
 * ending up on film. Code cards are cut from the real files in demo/shop.
 *
 * Render: `just demo-video promo` / `just demo-video qa`.
 *
 * DRAFT SCRIPT — not yet approved by Kelvin. Drafts are narrated in his cloned
 * voice like every film; he approves the script by watching it.
 */

import { expect, type Page } from "product-video/test";
import { click, park, press, type } from "product-video/actions";
import { showCode } from "product-video/codecard";
import type { Scene, Storyboard } from "product-video/types";
import { resolve } from "path";
import { WORKSPACE, terminalState, waitForScreen, tmux, TMUX_SESSION } from "./lib";

const PLAYER = `file://${resolve(__dirname, "assets/player.html")}`;
const REEL = resolve(WORKSPACE, "merged-demo.webm");

/** Open the terminal with room for the logo above it and the captions below it. */
async function openTerminal(page: Page): Promise<void> {
  await page.goto(terminalState().url);
  await page.addStyleTag({
    content: `html, body { background: #0d1117 !important; }
      body { box-sizing: border-box; padding: 84px 48px 136px !important; height: 100vh; }
      #terminal-container { height: 100% !important; width: 100% !important; }`,
  });
  // ttyd fits the terminal to its container on resize.
  await page.evaluate(() => window.dispatchEvent(new Event("resize")));
  await expect(page.locator(".xterm-screen")).toBeVisible();
  await page.waitForTimeout(400);
}

/** Show the terminal, focused, as the user left it. */
async function terminal(page: Page): Promise<void> {
  if (!page.url().startsWith(terminalState().url)) await openTerminal(page);
  await click(page, page.locator(".xterm-screen"));
}

/** An empty screen with only the prompt, before the next command. */
async function fresh(page: Page): Promise<void> {
  tmux("send-keys", "-t", TMUX_SESSION, "clear", "Enter");
  await waitForScreen(/^acme-shop \$ $/m, 5000);
  await page.waitForTimeout(300);
}

/** Type a command at the prompt and run it. */
async function run(page: Page, command: string): Promise<void> {
  await terminal(page);
  await type(page, command);
  await page.waitForTimeout(250);
  await press(page, "Enter", { badge: false });
  await park(page, { x: 1250, y: 30 });
}

const video = (page: Page) => page.locator("video");

/** Play the reel until it reaches `seconds` (or its end). */
async function playUntil(page: Page, seconds: number): Promise<void> {
  await video(page).evaluate((v: HTMLVideoElement) => v.play());
  await page.waitForFunction(
    (s) => {
      const v = document.querySelector("video")!;
      return v.ended || v.currentTime >= s;
    },
    seconds,
    { timeout: 120000 },
  );
}

const record: Scene = {
  title: "Record",
  steps: [
    {
      caption: "Playwright can record every test. Turn video on, and add the JSON reporter.",
      act: async (page) => {
        await showCode(
          page,
          {
            file: "demo/shop/playwright.config.ts",
            from: /^export default defineConfig/,
            to: /^\}\);$/,
            mark: [/video: \{ mode: 'on'/, /\['json'/],
          },
          "playwright.config.ts",
        );
      },
      hold: 3500,
      still: "01-config",
    },
    {
      caption: "Then run the tests as usual: four tests for a small shop.",
      act: async (page) => {
        await run(page, "npx playwright test");
      },
      check: async () => {
        await waitForScreen(/4 passed/, 90000);
      },
      hold: 3500,
      still: "02-tests",
    },
    {
      caption: "Five recordings. The chat test films two browsers, and those videos get hash names.",
      act: async (page) => {
        await fresh(page);
        await run(page, "find test-results -name '*.webm'");
      },
      check: async () => {
        await waitForScreen(/page@[0-9a-f]+\.webm[\s\S]*page@[0-9a-f]+\.webm/);
      },
      hold: 4000,
      still: "03-recordings",
    },
  ],
};

const merge: Scene = {
  title: "Merge",
  steps: [
    {
      caption: "One command merges them, in the order the tests are written.",
      act: async (page) => {
        await fresh(page);
        await run(page, "npx playwright-video-merge --report playwright-report.json --sort report-order");
      },
      check: async () => {
        await waitForScreen("Merged 5 videos", 120000);
      },
      hold: 3500,
      still: "04-merge",
    },
    {
      caption: "This is the reel. Every test opens with its name, taken from the report.",
      act: async (page) => {
        await page.goto(`${PLAYER}?src=file://${REEL}`);
        await expect.poll(() => video(page).evaluate((v: HTMLVideoElement) => v.duration)).toBeGreaterThan(10);
        await park(page);
        await playUntil(page, 6);
      },
      check: async (page) => {
        expect(await video(page).evaluate((v: HTMLVideoElement) => v.currentTime)).toBeGreaterThan(5);
      },
      hold: 4000,
      still: "05-reel",
    },
    {
      caption: "A test that films two browsers shows both, as part one and part two.",
      act: async (page) => {
        await playUntil(page, Number.MAX_SAFE_INTEGER);
      },
      check: async (page) => {
        expect(await video(page).evaluate((v: HTMLVideoElement) => v.ended)).toBe(true);
      },
      hold: 3000,
      still: "06-two-browsers",
    },
  ],
};

const useIt: Scene = {
  title: "Use it",
  steps: [
    {
      caption: "Add it as a script, and every test run leaves you a fresh demo.",
      act: async (page) => {
        await showCode(
          page,
          {
            file: "demo/shop/package.json",
            from: /"scripts": \{/,
            to: /^  \},$/,
            mark: [/"reel":/],
          },
          "package.json",
        );
      },
      hold: 4000,
    },
  ],
};

export const storyboard: Storyboard = {
  name: "playwright-video-merge",
  title: "From Playwright test videos to one demo reel",
  subtitle: "@viaalink/playwright-video-merge",
  byline: "by Viaalink",
  intro: [
    "Your end-to-end tests already show everything your app can do.",
    "Playwright video merge turns their recordings into one demo reel.",
  ],
  closing: [
    "npm   npmjs.com/package/@viaalink/playwright-video-merge",
    "GitHub   github.com/viaalink/playwright-video-merge",
    "Viaalink   viaalink.com",
  ],
  // DRAFT — for Kelvin's approval, word for word.
  outro: ["Find Playwright video merge on NPM and GitHub."],
  open: async (page) => {
    await openTerminal(page);
  },
  prepare: async (page) => {
    tmux("send-keys", "-t", TMUX_SESSION, "clear", "Enter");
    await park(page);
  },
  scenes: [record, merge, useIt],
};
