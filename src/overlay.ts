import { join } from 'node:path';
import { writeFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { randomBytes } from 'node:crypto';
import { resolveFont } from './font-resolver.js';
import { runFfmpeg, quoteFilterValue, codecArgs } from './run-ffmpeg.js';
import type { MergeOptions } from './types.js';

/**
 * Add a text overlay to a video showing the test name.
 * Returns the path to the processed video in a temp directory.
 */
export async function addOverlay(
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
  // The name goes through a text file, so no character in a test title needs escaping.
  const textFile = join(tmpdir(), `pvmerge-${randomBytes(8).toString('hex')}.txt`);
  await writeFile(textFile, displayName, 'utf8');

  const drawtext = [
    `${fontOpt.key}=${quoteFilterValue(fontOpt.value)}`,
    `textfile=${quoteFilterValue(textFile)}`,
    'expansion=none',
    `fontsize=${fontSize}`,
    `fontcolor=${quoteFilterValue(fontColor)}`,
    `x=(w-text_w)/2`,
    `y=h-50`,
    `box=1`,
    `boxcolor=${quoteFilterValue(boxColor)}`,
    `boxborderw=5`,
    `enable=${quoteFilterValue(`between(t,0,${duration})`)}`,
  ].join(':');

  try {
    await runFfmpeg(['-i', inputPath, '-vf', `drawtext=${drawtext}`, ...codecArgs(format), outputPath]);
  } catch (err) {
    throw new Error(`Overlay failed for "${displayName}": ${err instanceof Error ? err.message : err}`);
  } finally {
    await unlink(textFile).catch(() => {});
  }
  return outputPath;
}
