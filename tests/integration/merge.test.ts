import { describe, it, expect, beforeAll } from 'vitest';
import { mergePlaywrightVideos, checkFfmpeg } from '../../src/index.js';
import { join } from 'node:path';
import { existsSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { randomBytes } from 'node:crypto';

const FIXTURES = join(__dirname, '..', 'fixtures');
const hasFfmpeg = checkFfmpeg().available;

describe.skipIf(!hasFfmpeg)('mergePlaywrightVideos (integration)', () => {
  it('should merge fixture videos into a single output', async () => {
    const output = join(tmpdir(), `pvmerge-test-${randomBytes(4).toString('hex')}.webm`);

    try {
      const result = await mergePlaywrightVideos({
        inputDir: join(FIXTURES, 'test-results'),
        outputPath: output,
        noOverlay: true, // Skip overlay to speed up test
        cleanup: true,
      });

      expect(result.videoCount).toBe(3);
      expect(result.outputPath).toBe(output);
      expect(existsSync(output)).toBe(true);
    } finally {
      if (existsSync(output)) unlinkSync(output);
    }
  });

  it('should merge with overlay', async () => {
    const output = join(tmpdir(), `pvmerge-overlay-${randomBytes(4).toString('hex')}.webm`);

    try {
      const progressEvents: string[] = [];
      const result = await mergePlaywrightVideos({
        inputDir: join(FIXTURES, 'test-results'),
        outputPath: output,
        overlayDuration: 1,
        cleanup: true,
        onProgress: (e) => progressEvents.push(e.stage),
      });

      expect(result.videoCount).toBe(3);
      expect(existsSync(output)).toBe(true);
      expect(progressEvents).toContain('finding');
      expect(progressEvents).toContain('overlaying');
      expect(progressEvents).toContain('merging');
      expect(progressEvents).toContain('done');
    } finally {
      if (existsSync(output)) unlinkSync(output);
    }
  }, 60000);

  it('should use report for display names', async () => {
    const output = join(tmpdir(), `pvmerge-report-${randomBytes(4).toString('hex')}.webm`);

    try {
      const result = await mergePlaywrightVideos({
        inputDir: join(FIXTURES, 'test-results'),
        outputPath: output,
        reportPath: join(FIXTURES, 'playwright-report.json'),
        noOverlay: true,
        cleanup: true,
      });

      expect(result.videoCount).toBe(3);
    } finally {
      if (existsSync(output)) unlinkSync(output);
    }
  });

  it('should merge real Playwright 1.58 output in report order, all five recordings', async () => {
    const output = join(tmpdir(), `pvmerge-real-${randomBytes(4).toString('hex')}.mp4`);
    const labels: string[] = [];

    try {
      const result = await mergePlaywrightVideos({
        inputDir: join(FIXTURES, 'playwright-1.58', 'test-results'),
        reportPath: join(FIXTURES, 'playwright-1.58', 'playwright-report.json'),
        outputPath: output,
        format: 'mp4',
        sort: 'report-order',
        overlayDuration: 1,
        onProgress: (e) => {
          if (e.stage === 'overlaying') labels.push(e.message.replace(/^Adding overlay \d+\/\d+: /, ''));
        },
      });

      expect(result.videoCount).toBe(5);
      expect(labels[2]).toBe('two users chat with each other (1/2)');
      expect(labels[4]).toBe('A: runs first in the file');
      expect(existsSync(output)).toBe(true);
    } finally {
      if (existsSync(output)) unlinkSync(output);
    }
  }, 60000);

  it('should throw for empty directory', async () => {
    await expect(
      mergePlaywrightVideos({
        inputDir: join(FIXTURES, 'nonexistent'),
        outputPath: '/tmp/should-not-exist.webm',
      })
    ).rejects.toThrow('No .webm videos found');
  });
});
