import { readdir, stat } from 'node:fs/promises';
import { join, basename } from 'node:path';
import type { FoundVideo } from './types.js';

/**
 * Recursively find every .webm recording in the given directory.
 *
 * Playwright saves the page of the `page` fixture as `video.webm` (more pages:
 * `video-1.webm`, ...). Contexts a test creates itself with `recordVideo` get
 * a hash name such as `7ac2f72d….webm`. All of them count. When one test folder
 * holds several recordings, they are numbered as parts in recording order.
 */
export async function findVideos(dir: string): Promise<FoundVideo[]> {
  const videos: FoundVideo[] = [];
  await walkDir(dir, videos);
  return videos;
}

async function walkDir(dir: string, results: FoundVideo[]): Promise<void> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return; // Directory doesn't exist or isn't readable
  }

  const here: FoundVideo[] = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkDir(fullPath, results);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.webm')) {
      const fileStat = await stat(fullPath);
      here.push({
        path: fullPath,
        displayName: formatDisplayName(basename(dir)),
        mtime: fileStat.mtime,
      });
    }
  }

  here.sort(compareInFolder);
  if (here.length > 1) {
    here.forEach((v, i) => {
      v.part = i + 1;
      v.partCount = here.length;
    });
  }
  results.push(...here);
}

/** `video.webm`, `video-1.webm`, ... first in their numeric order, then other files by recording time. */
function compareInFolder(a: FoundVideo, b: FoundVideo): number {
  const ra = fixtureRank(basename(a.path));
  const rb = fixtureRank(basename(b.path));
  if (ra !== rb) return ra - rb;
  return a.mtime.getTime() - b.mtime.getTime() || a.path.localeCompare(b.path);
}

function fixtureRank(file: string): number {
  if (file === 'video.webm') return 0;
  const m = /^video-(\d+)\.webm$/.exec(file);
  return m ? Number(m[1]) : Number.MAX_SAFE_INTEGER;
}

/**
 * Convert Playwright's folder naming convention to a readable display name.
 * e.g. "login-test-should-display-form-chromium" → "login test should display form (chromium)"
 */
export function formatDisplayName(folderName: string): string {
  // Playwright folders: test-title-browser or test-title-browser-retry1
  const browsers = ['chromium', 'firefox', 'webkit'];
  let name = folderName;
  let browser = '';

  for (const b of browsers) {
    const idx = name.lastIndexOf(`-${b}`);
    if (idx !== -1) {
      browser = b;
      name = name.substring(0, idx);
      // Strip retry suffix if present
      const afterBrowser = folderName.substring(idx + b.length + 1);
      if (afterBrowser && afterBrowser.startsWith('-retry')) {
        browser += ` ${afterBrowser.substring(1)}`;
      }
      break;
    }
  }

  // Replace hyphens with spaces
  name = name.replace(/-/g, ' ');

  return browser ? `${name} (${browser})` : name;
}
