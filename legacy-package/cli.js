#!/usr/bin/env node
console.error(
  "@accelerated-software-development/playwright-video-merge is now @viaalink/playwright-video-merge; this name is deprecated.",
);
await import("@viaalink/playwright-video-merge/cli");
