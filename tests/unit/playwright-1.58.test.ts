// Real output of Playwright 1.58 (tests/fixtures/playwright-1.58/app.spec.ts):
// a describe block, a title Playwright shortens with a hash, a test that records
// two contexts itself (hash-named .webm files), and a title with a capital and a colon.
import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { findVideos } from '../../src/video-finder.js';
import { parseReport, enrichVideosWithReport } from '../../src/report-parser.js';
import { sortVideos, overlayLabel } from '../../src/merger.js';

const DIR = join(__dirname, '..', 'fixtures', 'playwright-1.58');
const RESULTS = join(DIR, 'test-results');
const REPORT = join(DIR, 'playwright-report.json');

describe('Playwright 1.58 output', () => {
  it('finds every recording, including hash-named ones from recordVideo contexts', async () => {
    const videos = await findVideos(RESULTS);
    expect(videos).toHaveLength(5);
    const chat = videos.filter(v => v.path.includes('two-users-chat'));
    expect(chat.map(v => [v.part, v.partCount])).toEqual([[1, 2], [2, 2]]);
  });

  it('lists report tests in declaration order without the file name', async () => {
    const tests = await parseReport(REPORT);
    expect(tests.map(t => t.fullTitle)).toEqual([
      'Checkout > adds an item to the cart',
      'Checkout > shows a very long test title that Playwright will have to shorten in the folder name because it goes on and on',
      'two users chat with each other',
      'A: runs first in the file',
    ]);
  });

  it('names every video from the report, also shortened and capitalised folders', async () => {
    const videos = enrichVideosWithReport(await findVideos(RESULTS), await parseReport(REPORT));
    const labels = sortVideos(videos, 'report-order').map(overlayLabel);
    expect(labels).toEqual([
      'Checkout > adds an item to the cart',
      'Checkout > shows a very long test title that Playwright will have to shorten in the folder name because it goes on and on',
      'two users chat with each other (1/2)',
      'two users chat with each other (2/2)',
      'A: runs first in the file',
    ]);
  });

  it('matches by folder name when the report has no video attachment', async () => {
    const tests = (await parseReport(REPORT)).map(t => ({ ...t, videoFolders: [] }));
    const videos = enrichVideosWithReport(await findVideos(RESULTS), tests);
    expect(videos.every(v => v.reportIndex !== undefined)).toBe(true);
  });

  it('marks retries', async () => {
    const tests = await parseReport(REPORT);
    const [v] = enrichVideosWithReport(
      [{ path: '/x/app-Checkout-adds-an-item-to-the-cart-chromium-retry1/video.webm', displayName: '', mtime: new Date() }],
      tests,
    );
    expect(v.displayName).toBe('Checkout > adds an item to the cart (retry1)');
  });
});
