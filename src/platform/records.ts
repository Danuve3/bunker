/** Récords y estadísticas locales (IndexedDB). */
import { score } from '../core/game';
import type { GameState } from '../core/types';
import { load, save } from './storage';

export interface RunSummary {
  seed: string;
  mode: GameState['mode'];
  threat: string; // amenaza principal o variante climática
  secondary?: string;
  days: number;
  phase: number;
  score: number;
  cause: string;
  date: string; // ISO
  doseMSv: number;
  perks: number;
}

export interface Records {
  runs: number;
  totalDays: number;
  best: Record<string, RunSummary>;
  causes: Record<string, number>;
  history: RunSummary[];
  daily: { lastDate: string | null; streak: number; bestStreak: number; best: Record<string, RunSummary> };
}

const KEY = 'records';
const HISTORY = 20;

export const emptyRecords = (): Records => ({
  runs: 0,
  totalDays: 0,
  best: {},
  causes: {},
  history: [],
  daily: { lastDate: null, streak: 0, bestStreak: 0, best: {} },
});

export async function loadRecords(): Promise<Records> {
  return { ...emptyRecords(), ...((await load<Records>(KEY)) ?? {}) };
}

export function summarize(s: GameState): RunSummary {
  return {
    seed: s.seed,
    mode: s.mode,
    threat: s.threat.variant ?? s.threat.primary,
    secondary: s.threat.secondary && s.phase >= (s.threat.secondaryFromPhase ?? 99) ? s.threat.secondary : undefined,
    days: s.day,
    phase: s.phase,
    score: score(s),
    cause: s.deathCause ?? 'heridas',
    date: new Date().toISOString(),
    doseMSv: Math.round(s.survivor.doseMSv),
    perks: s.perks.length,
  };
}

/** "DIA-20261114" → "2026-11-14" */
export const dailyDate = (seed: string) => {
  const m = seed.match(/^DIA-(\d{4})(\d{2})(\d{2})$/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
};

function prevDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Puro: aplica una partida terminada a los récords. */
export function applyRun(r: Records, run: RunSummary): { records: Records; newBest: boolean } {
  const rec: Records = structuredClone(r);
  if (run.mode === 'tutorial') return { records: rec, newBest: false };
  rec.runs++;
  rec.totalDays += run.days;
  rec.causes[run.cause] = (rec.causes[run.cause] ?? 0) + 1;
  rec.history.unshift(run);
  rec.history = rec.history.slice(0, HISTORY);
  const prev = rec.best[run.threat];
  const newBest = !prev || run.score > prev.score;
  if (newBest) rec.best[run.threat] = run;
  const date = run.mode === 'diaria' ? dailyDate(run.seed) : null;
  if (date) {
    const d = rec.daily;
    if (d.lastDate !== date) {
      d.streak = d.lastDate === prevDay(date) ? d.streak + 1 : 1;
      d.lastDate = date;
      d.bestStreak = Math.max(d.bestStreak, d.streak);
    }
    if (!d.best[date] || run.score > d.best[date].score) d.best[date] = run;
  }
  return { records: rec, newBest };
}

export async function recordRun(s: GameState): Promise<{ records: Records; newBest: boolean }> {
  const res = applyRun(await loadRecords(), summarize(s));
  await save(KEY, res.records);
  return res;
}
