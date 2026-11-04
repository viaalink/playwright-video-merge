#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { relative, isAbsolute } from 'node:path';
import { Command } from 'commander';
import { merge } from './merger.js';
import { checkFfmpeg } from './ffmpeg-check.js';
import type { MergeOptions } from './types.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

/** A path under the current directory is shown relative to it, so the output stays short. */
function shown(path: string): string {
  const rel = relative(process.cwd(), path);
  return rel && !rel.startsWith('..') && !isAbsolute(rel) ? rel : path;
}

const program = new Command();

program
  .name('playwright-video-merge')
  .description('Merge Playwright test result videos into a single demo reel with test name overlays')
  .version(pkg.version)
  .option('-i, --input <dir>', 'Input directory containing test results', './test-results')
  .option('-o, --output <file>', 'Output file path', './merged-demo.webm')
  .option('-r, --report <file>', 'Path to playwright-report.json for full test names')
  .option('-f, --format <format>', 'Output format: webm or mp4', 'webm')
  .option('-d, --overlay-duration <seconds>', 'Duration to show overlay text', '5')
  .option('--font <name>', 'Font name or path to .ttf file', 'DejaVu Sans')
  .option('--font-size <px>', 'Font size in pixels', '24')
  .option('--font-color <color>', 'Font color', 'white')
  .option('--box-color <color>', 'Background box color', 'black@0.5')
  .option('--sort <strategy>', 'Sort strategy: alphabetical, report-order, mtime', 'alphabetical')
  .option('--no-overlay', 'Skip overlay, just concatenate videos')
  .option('--no-cleanup', 'Keep intermediate temporary files')
  .option('-v, --verbose', 'Verbose output')
  .action(async (opts) => {
    // Check ffmpeg first
    const ffmpegInfo = checkFfmpeg();
    if (!ffmpegInfo.available) {
      console.error('Error: ffmpeg is not installed or not found in PATH.');
      console.error('Install ffmpeg to use this tool.');
      process.exit(1);
    }

    if (opts.verbose) {
      console.log(`Using ffmpeg ${ffmpegInfo.version} at ${ffmpegInfo.path}`);
    }

    const options: MergeOptions = {
      inputDir: opts.input,
      outputPath: opts.output,
      format: opts.format as 'webm' | 'mp4',
      reportPath: opts.report,
      overlayDuration: Number(opts.overlayDuration),
      font: opts.font,
      fontSize: Number(opts.fontSize),
      fontColor: opts.fontColor,
      boxColor: opts.boxColor,
      sort: opts.sort as MergeOptions['sort'],
      noOverlay: !opts.overlay,
      cleanup: opts.cleanup,
      onProgress: (event) => {
        if (opts.verbose) {
          const progress = event.current && event.total
            ? ` [${event.current}/${event.total}]`
            : '';
          console.log(`${event.stage}${progress}: ${event.message}`);
        } else if (event.stage === 'overlaying' && event.current && event.total) {
          // Show a compact progress line
          process.stdout.write(`\rProcessing ${event.current}/${event.total}...`);
          if (event.current === event.total) process.stdout.write('\n');
        }
      },
    };

    try {
      const result = await merge(options);
      console.log(`Done! Merged ${result.videoCount} videos → ${shown(result.outputPath)}`);
    } catch (err) {
      console.error(`Error: ${err instanceof Error ? err.message : err}`);
      process.exit(1);
    }
  });

program.parse();
