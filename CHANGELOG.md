# Changelog

## [0.2.1](https://github.com/viaalink/playwright-video-merge/compare/v0.2.0...v0.2.1) (2026-11-04)

### Bug Fixes

- **No more deprecation warning on install.** `fluent-ffmpeg` is no longer supported upstream
  and npm warned about it on every install. The tool now calls `ffmpeg` directly; the only
  runtime dependency left is `commander`.
- **Test names are drawn exactly as written.** The overlay text is read from a file with
  expansion off, so quotes, colons, `%`, backslashes and `%{...}` in a test title appear
  literally.
- **Playable MP4 everywhere:** `-f mp4` writes `yuv420p` with `+faststart`.
- **About 7× faster WebM.** VP8 is encoded with `-deadline realtime -cpu-used 8`: four 1280×720
  recordings (36 s) merge in 7.5 s instead of 55 s with 0.2.0, at about the same size.

### Other

- **package:** homepage is https://viaalink.com.
- First release through npm trusted publishing (GitHub Actions, `release.yml`).

## [0.2.0](https://github.com/viaalink/playwright-video-merge/compare/v0.1.0...v0.2.0) (2026-11-04)

The package is now `@viaalink/playwright-video-merge`, maintained by
[Viaalink](https://viaalink.com).

### ⚠ BREAKING CHANGES

- **Package name:** `@accelerated-software-development/playwright-video-merge` is now
  `@viaalink/playwright-video-merge`. Same CLI command and API: replace the name in
  `package.json` and your imports. The old name is deprecated; its last version (0.1.1)
  re-exports this package and its command runs this CLI.
- **Node.js 20 or later.** Node 18 reached end of life in April 2025.
- **Display names** from `--report` leave out the spec file name:
  `Login Page > should display login form` instead of
  `tests/login.pw.ts > Login Page > should display login form`.

### Bug Fixes

Found by running the tool on real Playwright 1.58 output, which is now a test fixture.

- **Every recording is merged.** Contexts a test records itself (`recordVideo`) produce
  hash-named `.webm` files; they were skipped. Several recordings in one test folder become
  parts, `(1/2)` and `(2/2)`, in recording order.
- **`--report` names every video.** Videos are matched by the folder of the report's video
  attachment. The folder-name fallback now handles capitals and the hash Playwright puts in
  shortened folder names. Retries are marked `(retry1)`.
- **`--sort report-order` works.** It did nothing; it now follows file and declaration order.
- An unreadable report is reported through `onProgress` instead of silently ignored.

### Other

- `@viaalink/playwright-video-merge/cli` is exported (the old package name runs it).
- vitest 3 → 5 and the open dependabot updates (postcss, picomatch, vite).
- A tag `v*.*.*` publishes to npm through trusted publishing; a version that is already on
  npm (a first release published by hand) is skipped.

## 0.1.0 (2026-04-07)

First release, as `@accelerated-software-development/playwright-video-merge`.
