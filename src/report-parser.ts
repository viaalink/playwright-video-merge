import { readFile } from 'node:fs/promises';
import { basename, dirname } from 'node:path';
import type { ReportTest, FoundVideo } from './types.js';

interface PlaywrightReport {
  suites: PlaywrightSuite[];
}

interface PlaywrightSuite {
  title: string;
  file?: string;
  suites?: PlaywrightSuite[];
  specs?: PlaywrightSpec[];
}

interface PlaywrightSpec {
  title: string;
  file: string;
  line?: number;
  column?: number;
  tests: PlaywrightTest[];
}

interface PlaywrightTest {
  id?: string;
  projectName: string;
  results: PlaywrightResult[];
}

interface PlaywrightResult {
  status: string;
  attachments?: PlaywrightAttachment[];
}

interface PlaywrightAttachment {
  name: string;
  path?: string;
}

/**
 * Parse the JSON report (`reporter: [['json', { outputFile }]]`) and list its
 * tests in report order, which is file order and, within a file, declaration order.
 */
export async function parseReport(reportPath: string): Promise<ReportTest[]> {
  const content = await readFile(reportPath, 'utf8');
  const report: PlaywrightReport = JSON.parse(content);
  const tests: ReportTest[] = [];

  for (const fileSuite of report.suites ?? []) {
    // The top-level suite is the spec file; its title is the file path, not a describe block.
    // The report lists a suite's own tests apart from its describe blocks, so sort each
    // file back into declaration order by line.
    const inFile: ReportTest[] = [];
    walkSuites(fileSuite, [], inFile);
    inFile.sort((a, b) => (a.line ?? 0) - (b.line ?? 0) || (a.column ?? 0) - (b.column ?? 0));
    tests.push(...inFile);
  }

  tests.forEach((t, i) => (t.order = i));
  return tests;
}

function walkSuites(suite: PlaywrightSuite, path: string[], results: ReportTest[], isFile = true): void {
  const currentPath = isFile ? path : [...path, suite.title].filter(Boolean);

  for (const spec of suite.specs ?? []) {
    for (const test of spec.tests) {
      const titlePath = [...currentPath, spec.title].filter(Boolean);
      const videoFolders = new Set<string>();
      for (const result of test.results ?? []) {
        for (const a of result.attachments ?? []) {
          if (a.name === 'video' && a.path) videoFolders.add(basename(dirname(a.path)));
        }
      }
      results.push({
        id: test.id ?? `${spec.file}:${titlePath.join(' > ')}:${test.projectName}`,
        file: spec.file,
        fullTitle: titlePath.join(' > '),
        titlePath,
        projectName: test.projectName,
        folderName: buildFolderName(spec.title, test.projectName),
        videoFolders: [...videoFolders],
        line: spec.line,
        column: spec.column,
      });
    }
  }

  for (const s of suite.suites ?? []) {
    walkSuites(s, currentPath, results, false);
  }
}

/**
 * A simplified form of the folder name Playwright creates for a test's artifacts
 * (kebab-case title plus project name). Only used when the report has no video
 * attachment that names the folder directly.
 */
function buildFolderName(specTitle: string, projectName: string): string {
  const kebab = specTitle
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `${kebab}-${projectName}`;
}

const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const stripRetry = (folder: string) => folder.replace(/-retry\d+$/, '');

/**
 * Does this artifact folder belong to this test? Playwright names it
 * `<file stem>-<title path>-<project>`, sanitised, and shortens a long name to
 * `<head>-<5 hex hash>-<tail>`. Compared case-insensitively on letters and digits.
 */
function folderMatches(folder: string, test: ReportTest): boolean {
  const name = stripRetry(folder);
  const stem = basename(test.file).replace(/\..*$/, '');
  const full = squash([stem, ...(test.titlePath ?? [test.fullTitle]), test.projectName ?? ''].join(' '));

  const shortened = /^(.*)-[0-9a-f]{5}-(.*)$/.exec(name);
  if (shortened) {
    const head = squash(shortened[1]);
    const tail = squash(shortened[2]);
    if (head && tail && full.startsWith(head) && full.endsWith(tail)) return true;
  }
  if (squash(name) === full) return true;
  return Boolean(test.folderName) && squash(name).endsWith(squash(test.folderName!));
}

/**
 * Give each video the full test title from the report and its position in the
 * report. A video is matched by the folder of the report's video attachment;
 * videos without one (contexts a test records itself) are matched by folder name.
 */
export function enrichVideosWithReport(videos: FoundVideo[], reportTests: ReportTest[]): FoundVideo[] {
  const byFolder = new Map<string, ReportTest>();
  for (const t of reportTests) {
    for (const f of t.videoFolders ?? []) if (!byFolder.has(f)) byFolder.set(f, t);
  }

  return videos.map(video => {
    const folder = basename(dirname(video.path));
    const match = byFolder.get(folder) ?? reportTests.find(t => folderMatches(folder, t));
    if (!match) return video;
    const retry = /-(retry\d+)$/.exec(folder);
    return {
      ...video,
      displayName: retry ? `${match.fullTitle} (${retry[1]})` : match.fullTitle,
      reportIndex: match.order,
    };
  });
}
