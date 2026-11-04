import { resolve as resolvePath, dirname } from 'node:path';
import { mkdir } from 'node:fs/promises';
import { findVideos } from './video-finder.js';
import { parseReport, enrichVideosWithReport } from './report-parser.js';
import { addOverlay } from './overlay.js';
import { cleanupFiles } from './cleanup.js';
import { requireFfmpeg } from './ffmpeg-check.js';
import { runFfmpeg, codecArgs } from './run-ffmpeg.js';
import type { MergeOptions, MergeResult, FoundVideo, ProgressEvent } from './types.js';

const DEFAULTS: Required<Omit<MergeOptions, 'reportPath' | 'onProgress'>> = {
  inputDir: './test-results',
  outputPath: './merged-demo.webm',
  format: 'webm',
  overlayDuration: 5,
  font: 'DejaVu Sans',
  fontSize: 24,
  fontColor: 'white',
  boxColor: 'black@0.5',
  sort: 'alphabetical',
  cleanup: true,
  noOverlay: false,
};

function emit(opts: MergeOptions, event: ProgressEvent): void {
  opts.onProgress?.(event);
}

function byNameThenPart(a: FoundVideo, b: FoundVideo): number {
  return a.displayName.localeCompare(b.displayName) || (a.part ?? 0) - (b.part ?? 0);
}

export function sortVideos(videos: FoundVideo[], strategy: string): FoundVideo[] {
  const sorted = [...videos];
  switch (strategy) {
    case 'mtime':
      sorted.sort((a, b) => a.mtime.getTime() - b.mtime.getTime() || (a.part ?? 0) - (b.part ?? 0));
      break;
    case 'report-order':
      // Tests in report order (file, then declaration order); videos the report
      // does not know about come last, alphabetically.
      sorted.sort((a, b) => {
        const ia = a.reportIndex ?? Number.MAX_SAFE_INTEGER;
        const ib = b.reportIndex ?? Number.MAX_SAFE_INTEGER;
        return ia - ib || byNameThenPart(a, b);
      });
      break;
    case 'alphabetical':
    default:
      sorted.sort(byNameThenPart);
      break;
  }
  return sorted;
}

/** The overlay text: the test name, plus "(1/2)" when the test recorded several videos. */
export function overlayLabel(video: FoundVideo): string {
  return video.partCount ? `${video.displayName} (${video.part}/${video.partCount})` : video.displayName;
}

async function mergeVideoFiles(inputPaths: string[], outputPath: string, format: 'webm' | 'mp4'): Promise<void> {
  // The concat filter re-encodes, so recordings with different codecs or timestamps still join cleanly.
  const inputs = inputPaths.flatMap((p) => ['-i', p]);
  const streams = inputPaths.map((_, i) => `[${i}:v:0]`).join('');
  const filter = `${streams}concat=n=${inputPaths.length}:v=1:a=0[v]`;
  try {
    await runFfmpeg([...inputs, '-filter_complex', filter, '-map', '[v]', ...codecArgs(format), outputPath]);
  } catch (err) {
    throw new Error(`Merge failed: ${err instanceof Error ? err.message : err}`);
  }
}

export async function merge(userOptions: MergeOptions = {}): Promise<MergeResult> {
  const opts = { ...DEFAULTS, ...userOptions };
  const inputDir = resolvePath(opts.inputDir);
  const outputPath = resolvePath(opts.outputPath);

  // Ensure ffmpeg is available
  requireFfmpeg();

  // Step 1: Find videos
  emit(opts, { stage: 'finding', message: `Searching for videos in ${inputDir}` });
  let videos = await findVideos(inputDir);

  if (videos.length === 0) {
    throw new Error(`No .webm videos found in ${inputDir}`);
  }

  // Enrich with report data if available
  if (opts.reportPath) {
    try {
      const reportTests = await parseReport(resolvePath(opts.reportPath));
      videos = enrichVideosWithReport(videos, reportTests);
    } catch (err) {
      // Report parsing failed — continue with folder names
      emit(opts, {
        stage: 'finding',
        message: `Could not read report ${opts.reportPath} (${err instanceof Error ? err.message : err}); using folder names`,
      });
    }
  }

  // Sort
  videos = sortVideos(videos, opts.sort);

  emit(opts, { stage: 'finding', current: videos.length, total: videos.length, message: `Found ${videos.length} videos` });

  // Step 2: Add overlays (or just use originals)
  const tempFiles: string[] = [];
  let processedPaths: string[];

  if (opts.noOverlay) {
    processedPaths = videos.map(v => v.path);
  } else {
    processedPaths = [];
    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      emit(opts, {
        stage: 'overlaying',
        current: i + 1,
        total: videos.length,
        message: `Adding overlay ${i + 1}/${videos.length}: ${overlayLabel(video)}`,
      });

      const processedPath = await addOverlay(video.path, overlayLabel(video), opts);
      processedPaths.push(processedPath);
      tempFiles.push(processedPath);
    }
  }

  // Step 3: Merge all videos
  emit(opts, { stage: 'merging', message: `Merging ${processedPaths.length} videos...` });
  await mkdir(dirname(outputPath), { recursive: true });
  await mergeVideoFiles(processedPaths, outputPath, opts.format);

  // Step 4: Cleanup temp files
  if (opts.cleanup && tempFiles.length > 0) {
    emit(opts, { stage: 'cleanup', message: 'Cleaning up temporary files...' });
    await cleanupFiles(tempFiles);
  }

  emit(opts, { stage: 'done', message: `Merged ${videos.length} videos → ${outputPath}` });

  return {
    outputPath,
    videoCount: videos.length,
  };
}
