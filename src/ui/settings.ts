/** Ajustes persistentes: audio, vibración, tamaño de texto y tutorial. */
import { effect, signal } from '@preact/signals';
import { audio } from '../audio/engine';
import { setHaptics } from '../platform/haptics';
import { load, save } from '../platform/storage';

export interface Settings {
  master: number;
  ambient: number;
  sfx: number;
  muted: boolean;
  haptics: boolean;
  textScale: number;
  tutorialDone: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  master: 0.7,
  ambient: 0.6,
  sfx: 0.8,
  muted: false,
  haptics: true,
  textScale: 1,
  tutorialDone: false,
};

export const settings = signal<Settings>(DEFAULT_SETTINGS);
let loaded = false;

export async function loadSettings() {
  settings.value = { ...DEFAULT_SETTINGS, ...((await load<Settings>('settings')) ?? {}) };
  loaded = true;
}

export function updateSettings(p: Partial<Settings>) {
  settings.value = { ...settings.value, ...p };
}

effect(() => {
  const s = settings.value;
  audio.setVolumes({ master: s.master, ambient: s.ambient, sfx: s.sfx, muted: s.muted });
  setHaptics(s.haptics);
  if (typeof document !== 'undefined') document.documentElement.style.fontSize = `${s.textScale * 100}%`;
  if (loaded) void save('settings', s);
});
