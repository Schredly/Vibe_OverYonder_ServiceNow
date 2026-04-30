import { spawn } from 'node:child_process';

export type LogLevel = 'stdout' | 'stderr' | 'system';
export interface LogLine {
  level: LogLevel;
  text: string;
}

export interface RunOptions {
  cmd: string;
  args: string[];
  cwd: string;
  env?: Record<string, string>;
  onLine: (line: LogLine) => void;
}

export interface RunResult {
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
}

export function runCmd({ cmd, args, cwd, env, onLine }: RunOptions): Promise<RunResult> {
  return new Promise((resolveRun, rejectRun) => {
    onLine({
      level: 'system',
      text: `$ ${cmd} ${args.join(' ')}  (cwd: ${cwd})`,
    });

    const child = spawn(cmd, args, {
      cwd,
      env: { ...process.env, ...(env ?? {}) },
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
    });

    let stdoutBuf = '';
    let stderrBuf = '';
    let stdoutLineBuf = '';
    let stderrLineBuf = '';

    const flushLines = (buf: string, level: LogLevel, trailing: string): string => {
      const combined = trailing + buf;
      const lines = combined.split(/\r?\n/);
      const last = lines.pop() ?? '';
      for (const line of lines) onLine({ level, text: line });
      return last;
    };

    child.stdout.on('data', (chunk: Buffer) => {
      const s = chunk.toString('utf8');
      stdoutBuf += s;
      stdoutLineBuf = flushLines(s, 'stdout', stdoutLineBuf);
    });
    child.stderr.on('data', (chunk: Buffer) => {
      const s = chunk.toString('utf8');
      stderrBuf += s;
      stderrLineBuf = flushLines(s, 'stderr', stderrLineBuf);
    });

    child.on('error', (err) => {
      onLine({ level: 'system', text: `! ${err.message}` });
      rejectRun(err);
    });

    child.on('close', (exitCode, signal) => {
      if (stdoutLineBuf) onLine({ level: 'stdout', text: stdoutLineBuf });
      if (stderrLineBuf) onLine({ level: 'stderr', text: stderrLineBuf });
      onLine({
        level: 'system',
        text: `↳ exit ${exitCode ?? 'null'}${signal ? ` (signal ${signal})` : ''}`,
      });
      resolveRun({ exitCode, signal, stdout: stdoutBuf, stderr: stderrBuf });
    });
  });
}
