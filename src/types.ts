export interface MergeOptions {
  /** Directory containing Playwright test results (default: ./test-results) */
  inputDir?: string;
  /** Output file path (default: ./merged-demo.webm) */
  outputPath?: string;
  /** Output format */
  format?: 'webm' | 'mp4';
  /** Path to playwright-report.json for full test names */
  reportPath?: string;
  /** Duration in seconds to show the overlay text (default: 5) */
  overlayDuration?: number;
  /** Font name (fontconfig) or path to .ttf file (default: DejaVu Sans) */
  font?: string;
  /** Font size in pixels (default: 24) */
  fontSize?: number;
  /** Font color (default: white) */
  fontColor?: string;
  /** Background box color (default: black@0.5) */
  boxColor?: string;
  /** Sort strategy for videos (default: alphabetical) */
  sort?: 'alphabetical' | 'report-order' | 'mtime';
  /** Whether to remove intermediate files after merging (default: true) */
  cleanup?: boolean;
  /** Skip overlay, just concatenate videos */
  noOverlay?: boolean;
  /** Progress callback */
  onProgress?: (event: ProgressEvent) => void;
}

export interface ProgressEvent {
  stage: 'finding' | 'overlaying' | 'merging' | 'cleanup' | 'done';
  current?: number;
  total?: number;
  message: string;
}

export interface MergeResult {
  outputPath: string;
  videoCount: number;
  duration?: number;
}

export interface FoundVideo {
  /** Absolute path to the .webm file */
  path: string;
  /** Display name derived from folder or report */
  displayName: string;
  /** Modification time (for mtime sorting) */
  mtime: Date;
  /** Part number when one test folder holds several recordings (1-based) */
  part?: number;
  /** Number of recordings in this video's test folder, when more than one */
  partCount?: number;
  /** Position of the matching test in the report (for report-order sorting) */
  reportIndex?: number;
}

export interface ReportTest {
  id: string;
  file: string;
  /** Describe blocks and test title, joined with " > " (the file name is left out) */
  fullTitle: string;
  titlePath?: string[];
  projectName?: string;
  /** Simplified folder name, used only when the report has no video attachment */
  folderName?: string;
  /** Folder names of this test's video attachments (one per run/retry) */
  videoFolders?: string[];
  line?: number;
  column?: number;
  /** Position in the report, in file and declaration order */
  order?: number;
}
