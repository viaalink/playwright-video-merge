# @viaalink/playwright-video-merge

Merge Playwright test result videos into a single demo reel with test name overlays.
Maintained by [Viaalink](https://viaalink.com).

Turn your E2E test recordings into a "what the system can do" demo video — automatically.

**See it in action:** [Our payment tests, as one video](https://youtu.be/ktt4sj2jYaw) (1:45):
viaalink.com's own Playwright payment tests against Mollie's test mode, merged into one video.

> Formerly `@accelerated-software-development/playwright-video-merge`. Same CLI and API:
> replace the package name in your `package.json` and imports. The old name is deprecated
> and its last version (0.1.1) only re-exports this package.

## What ends up in the reel

- **Every recording.** The `page` fixture's `video.webm` (and `video-1.webm`, ... for more
  pages), and the hash-named `.webm` files of contexts a test records itself with
  `recordVideo`. A test with several recordings shows them in recording order as
  `title (1/2)`, `title (2/2)`.
- **Real test names** with `--report`: describe blocks and title, e.g.
  `Checkout > adds an item to the cart`. Videos are matched through the report's video
  attachments, so shortened folder names (`...-18022-...`) and retries (`(retry1)`) are named
  correctly too.
- **Your test order** with `--sort report-order`: file by file, in declaration order.

## Requirements

- **Node.js** >= 20
- **ffmpeg** installed and in PATH

```bash
# Ubuntu/Debian
sudo apt install ffmpeg

# macOS
brew install ffmpeg

# Windows
choco install ffmpeg
```

## Installation

```bash
npm install -D @viaalink/playwright-video-merge
```

## Playwright Video Configuration

By default, Playwright only records videos for failed tests. To create a demo reel, you need to record all tests:

```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    video: {
      mode: 'on',  // Record all tests (not just failures)
      size: { width: 1280, height: 720 },
    },
  },
  reporter: [
    ['json', { outputFile: 'playwright-report.json' }],
  ],
});
```

## CLI Usage

```bash
# Basic — merge all videos in test-results/
npx playwright-video-merge

# With test names from report
npx playwright-video-merge --report playwright-report.json

# Custom output format
npx playwright-video-merge -o demo.mp4 -f mp4

# Just concatenate, no overlays
npx playwright-video-merge --no-overlay
```

### CLI Options

```
-i, --input <dir>          Input directory (default: ./test-results)
-o, --output <file>        Output file (default: ./merged-demo.webm)
-r, --report <file>        JSON report (Playwright's json reporter) for test names
-f, --format <format>      Output format: webm or mp4 (default: webm)
-d, --overlay-duration <s> Overlay duration in seconds (default: 5)
--font <name>              Font name or .ttf path (default: DejaVu Sans)
--font-size <px>           Font size in pixels (default: 24)
--font-color <color>       Font color (default: white)
--box-color <color>        Background box color (default: black@0.5)
--sort <strategy>          alphabetical | report-order | mtime (default: alphabetical)
                           report-order needs --report
--no-overlay               Skip overlay, just concatenate
--no-cleanup               Keep intermediate files
-v, --verbose              Verbose output
```

## Programmatic API

```typescript
import { mergePlaywrightVideos } from '@viaalink/playwright-video-merge';

const result = await mergePlaywrightVideos({
  inputDir: './test-results',
  outputPath: './merged-demo.webm',
  reportPath: './playwright-report.json',
  overlayDuration: 5,
  font: 'DejaVu Sans',
  fontSize: 24,
  fontColor: 'white',
  boxColor: 'black@0.5',
  sort: 'alphabetical',
  cleanup: true,
  onProgress: (event) => {
    console.log(`[${event.stage}] ${event.message}`);
  },
});

console.log(`Merged ${result.videoCount} videos → ${result.outputPath}`);
```

### Check ffmpeg availability

```typescript
import { checkFfmpeg } from '@viaalink/playwright-video-merge';

const info = checkFfmpeg();
if (!info.available) {
  console.error('ffmpeg is required');
}
```

## npm Script Integration

Add to your `package.json`:

```json
{
  "scripts": {
    "merge-videos": "playwright-video-merge --report playwright-report.json"
  }
}
```

Then run after tests:

```bash
npx playwright test
npm run merge-videos
```

## Example

[`tests/fixtures/playwright-1.58`](tests/fixtures/playwright-1.58) is the real output of
Playwright 1.58 for [`app.spec.ts`](tests/fixtures/playwright-1.58/app.spec.ts): a describe
block, a title Playwright shortens, a test with two browser contexts and a top-level test.

```bash
npx playwright-video-merge \
  -i tests/fixtures/playwright-1.58/test-results \
  -r tests/fixtures/playwright-1.58/playwright-report.json \
  --sort report-order -o reel.mp4 -f mp4
```

## License

MIT
