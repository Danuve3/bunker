import type { GameState, LogEntry } from './types';

const MAX_LOG = 120;

export function log(s: GameState, key: string, p?: LogEntry['p'], tone: LogEntry['tone'] = 'info'): LogEntry {
  const e: LogEntry = { h: s.h, key, p, tone };
  s.log.push(e);
  if (s.log.length > MAX_LOG) s.log.splice(0, s.log.length - MAX_LOG);
  if (s.lastReport) s.lastReport.notes.push(e);
  return e;
}

export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
