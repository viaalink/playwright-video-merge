import ffmpeg from 'fluent-ffmpeg';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomBytes } from 'node:crypto';
import { resolveFont } from './font-resolver.js';
import type { MergeOptions } from './types.js';

/**
 * Add a text overlay to a video showing the test name.
 * Returns the path to the processed video in a temp directory.
 */
export function addOverlay(
  inputPath: string,
  displayName: string,
  options: Pick<MergeOptions, 'overlayDuration' | 'font' | 'fontSize' | 'fontColor' | 'boxColor' | 'format'>
): Promise<string> {
  const duration = options.overlayDuration ?? 5;
  const fontSize = options.fontSize ?? 24;
  const fontColor = options.fontColor ?? 'white';
  const boxColor = options.boxColor ?? 'black@0.5';
  const format = options.format ?? 'webm';

  const ext = format === 'mp4' ? '.mp4' : '.webm';
  const outputPath = join(tmpdir(), `pvmerge-${randomBytes(8).toString('hex')}${ext}`);

  const fontOpt = resolveFont(options.font);
  // Escape special characters in display name for ffmpeg drawtext
  const escapedName = displayName
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "'\\''")
    .replace(/:/g, '\\:')
    .replace(/%/g, '%%');

  const filterOpts: Record<string, string | number> = {
    [fontOpt.key]: fontOpt.value,
    text: escapedName,
    fontsize: fontSize,
    fontcolor: fontColor,
    x: '(w-text_w)/2',
    y: 'h-50',
    box: 1,
    boxcolor: boxColor,
    boxborderw: 5,
    enable: `between(t,0,${duration})`,
  };

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoFilters([{ filter: 'drawtext', options: filterOpts }])
      .on('end', () => resolve(outputPath))
      .on('error', (err: Error) => reject(new Error(`Overlay failed for "${displayName}": ${err.message}`)))
      .save(outputPath);
  });
}
