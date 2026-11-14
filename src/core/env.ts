/** Entorno exterior en función del tiempo: temperatura, radiación, red, contagio, saqueadores. */
import { FALLOUT, THERMAL } from '../data/environment';
import { phasePressure } from '../data/threats';
import type { EnvMod, GameState } from './types';
import { perkMods } from './perks';

export const clockHour = (s: GameState, h = s.h) => (s.startClock + h) % 24;
export const isNight = (s: GameState, h = s.h) => {
  const c = clockHour(s, h);
  return c >= 21 || c < 7;
};

export function modValue(s: GameState, kind: EnvMod['kind'], h = s.h): number {
  let v = 0;
  for (const m of s.threat.mods) if (m.kind === kind && h >= m.fromH && h < m.toH) v += m.value;
  return v;
}
export const modActive = (s: GameState, kind: EnvMod['kind'], h = s.h) =>
  s.threat.mods.some((m) => m.kind === kind && h >= m.fromH && h < m.toH);

export function outdoorTemp(s: GameState, h = s.h): number {
  // Oscilación diaria ±4 °C con mínimo hacia las 6:00 (simplificación).
  const c = clockHour(s, h);
  const diurnal = -4 * Math.cos(((c - 6) / 24) * 2 * Math.PI);
  return s.threat.baseTempC + diurnal + modValue(s, 'tempOffset', h);
}

export function groundTemp(s: GameState): number {
  // Un frío extremo prolongado enfría algo el terreno somero (simplificación).
  return THERMAL.groundTempC + Math.min(0, s.threat.baseTempC - THERMAL.groundTempC) * 0.12;
}

/** Tasa de dosis exterior (mSv/h): suma de fuentes con decaimiento t^-1,2 (regla 7-10). */
export function outdoorDoseRate(s: GameState, h = s.h): number {
  let rate = 0;
  for (const f of s.threat.fallout) {
    const t = h - f.atH;
    if (t < FALLOUT.arrivalH) continue;
    rate += f.r1 * Math.pow(t, -FALLOUT.decayExponent);
  }
  return rate;
}

export const gridUp = (s: GameState, h = s.h) =>
  h < s.threat.eventH || (h < s.threat.gridUntilH && !modActive(s, 'noGrid', h));
export const mainsUp = (s: GameState, h = s.h) => h < s.threat.eventH || h < s.threat.waterMainsUntilH;

/** Probabilidad por hora de contagio en el exterior sin protección. */
export function outdoorInfection(s: GameState, h = s.h): number {
  if (h < s.threat.eventH) return 0;
  return s.threat.infectionPressure * phasePressure(Math.max(1, s.phase));
}

export function looterRisk(s: GameState, h = s.h): number {
  if (h < s.threat.eventH) return 0;
  const base = s.threat.looterPressure * phasePressure(Math.max(1, s.phase));
  return Math.max(0, (base + modValue(s, 'looters', h) + s.noise24 * 0.012 + s.visibility * 0.01) * perkMods(s).looterMult);
}
