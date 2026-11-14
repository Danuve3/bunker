/** Estado de la interfaz: la partida (signal) y el puente con la simulación y el guardado. */
import { signal } from '@preact/signals';
import { dispatch, type Action } from '../core/game';
import { newGame, SAVE_VERSION } from '../core/state';
import { dailySeed, seedFromEntropy } from '../core/rng';
import type { GameMode, GameState } from '../core/types';
import { load, remove, save } from '../platform/storage';
import { emptyRecords, loadRecords, recordRun, type Records } from '../platform/records';
import { feedback } from './feedback';
import { loadSettings } from './settings';

export type Screen = 'menu' | 'game' | 'howto' | 'records' | 'settings';

export const game = signal<GameState | null>(null);
export const screen = signal<Screen>('menu');
export const savedRun = signal<GameState | null>(null);
/** Hoja inferior abierta (id libre por pantalla). */
export const sheet = signal<string | null>(null);
/** Mostrar el informe del último día. */
export const showReport = signal(false);
/** Celda seleccionada en la vista del búnker. */
export const selectedCell = signal<{ c: number; r: number } | null>(null);

export const records = signal<Records>(emptyRecords());
/** La última partida terminada batió el récord de su amenaza. */
export const newBest = signal(false);
/** Mensaje breve en pantalla (toast). */
export const toast = signal<string | null>(null);
let toastTimer: ReturnType<typeof setTimeout> | undefined;
export function showToast(msg: string) {
  toast.value = msg;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.value = null), 2600);
}

const RUN_KEY = 'run';

export async function boot() {
  await loadSettings();
  records.value = await loadRecords();
  const s = await load<GameState>(RUN_KEY);
  if (s && s.v === SAVE_VERSION && s.stage !== 'dead') savedRun.value = s;
  // ?seed=XXXX abre directamente una partida con esa semilla
  const seed = new URLSearchParams(location.search).get('seed');
  if (seed) {
    const clean = seed.slice(0, 32).toUpperCase();
    start(clean, /^DIA-\d{8}$/.test(clean) ? 'diaria' : 'normal');
    history.replaceState(null, '', location.pathname);
  }
}

/** Única fuente de entropía externa: genera una semilla legible para partidas normales. */
export function randomSeed(): string {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return seedFromEntropy(a[0]);
}

export function start(seed: string, mode: GameMode) {
  const s = newGame(seed, { mode });
  game.value = s;
  savedRun.value = s;
  screen.value = 'game';
  showReport.value = false;
  newBest.value = false;
  selectedCell.value = null;
  void save(RUN_KEY, s);
}

export const startDaily = () => start(dailySeed(new Date()), 'diaria');
/** Tutorial guiado (hito 8): partida corta con semilla fija. */
export const startTutorial = () => start('TUTORIAL', 'tutorial');

export function resume() {
  if (!savedRun.value) return;
  game.value = savedRun.value;
  screen.value = 'game';
}

export function act(a: Action) {
  const s0 = game.value;
  if (!s0) return;
  const s = dispatch(s0, a);
  game.value = s;
  savedRun.value = s.stage === 'dead' ? null : s;
  if (s.stage === 'dead') {
    void remove(RUN_KEY);
    if (s0.stage !== 'dead')
      void recordRun(s).then((r) => {
        records.value = r.records;
        newBest.value = r.newBest;
      });
  } else void save(RUN_KEY, s);
  if ((a.t === 'advanceDay' || (a.t === 'choose' && s0.stage === 'boss')) && s.lastReport) showReport.value = true;
  feedback(s0, s, a);
}

export function toMenu() {
  screen.value = 'menu';
  sheet.value = null;
  selectedCell.value = null;
}
