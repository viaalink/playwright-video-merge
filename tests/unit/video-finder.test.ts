import { describe, it, expect } from 'vitest';
import { findVideos } from '../../src/video-finder.js';
import { join } from 'node:path';

const FIXTURES = join(__dirname, '..', 'fixtures', 'test-results');

describe('findVideos', () => {
  it('should find all video.webm files in fixture directory', async () => {
    const videos = await findVideos(FIXTURES);
    expect(videos).toHaveLength(3);
    expect(videos.every(v => v.path.endsWith('.webm'))).toBe(true);
  });

  it('should extract display names from folder names', async () => {
    const videos = await findVideos(FIXTURES);
    const names = videos.map(v => v.displayName).sort();
    expect(names).toEqual([
      'should display login form (chromium)',
      'should handle invalid credentials (chromium)',
      'should load widgets (chromium)',
    ]);
  });

  it('should include mtime for each video', async () => {
    const videos = await findVideos(FIXTURES);
    for (const v of videos) {
      expect(v.mtime).toBeInstanceOf(Date);
    }
  });

  it('should return empty array for non-existent directory', async () => {
    const videos = await findVideos('/nonexistent/path');
    expect(videos).toEqual([]);
  });
});
