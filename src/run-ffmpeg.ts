import { spawn } from 'node:child_process';

/**
 * Run ffmpeg with these arguments. Resolves when it exits 0; rejects with the
 * last lines of its output otherwise. No shell is involved, so paths and test
 * names are passed through untouched.
 */
export function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', ['-hide_banner', '-nostdin', '-y', ...args], {
      stdio: ['ignore', 'ignore', 'pipe'],
    });
    let err = '';
    proc.stderr.on('data', (d: Buffer) => {
      err = (err + d.toString()).slice(-4000);
    });
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}: ${err.trim().split('\n').slice(-5).join('\n')}`));
    });
  });
}

/**
 * Quote a value for an ffmpeg filter option: single quotes protect `:` and `,`;
 * a single quote inside is closed, escaped and reopened.
 */
export function quoteFilterValue(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "'\\''")}'`;
}

/** Codec options for the chosen output format. Playwright videos have no audio. */
export function codecArgs(format: 'webm' | 'mp4'): string[] {
  return format === 'mp4'
    ? ['-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an']
    : ['-c:v', 'libvpx', '-b:v', '2M', '-an'];
}
