/** Valores derivados para la interfaz (puros). */
import { AIR, DOSE } from '../data/environment';
import { ENERGY, THERMO, WATER } from '../data/physiology';
import { batteryCapacityWh, shelterCell } from './bunker';
import { mainsUp, outdoorDoseRate } from './env';
import { edibleKcal } from './food';
import type { GameState } from './types';

export function dailyWaterUse(s: GameState): number {
  const r = WATER.rations[s.plan.water];
  return r.drink + r.hygiene;
}
/** Días de agua potable: el agua no potable cubre el aseo mientras dura. */
export function waterDays(s: GameState): number {
  if (s.stage !== 'prep' && s.stage !== 'briefing' && mainsUp(s)) return Infinity;
  const { drink, hygiene } = WATER.rations[s.plan.water];
  const agua = s.inv.agua ?? 0;
  const raw = s.inv.aguaBruta ?? 0;
  const dDrinkOnly = agua / drink;
  if (hygiene <= 0 || raw / hygiene >= dDrinkOnly) return dDrinkOnly;
  const dRaw = raw / hygiene; // días con el aseo cubierto por agua no potable
  return dRaw + (agua - dRaw * drink) / (drink + hygiene);
}
export const foodDays = (s: GameState) => edibleKcal(s) / ENERGY.rations[s.plan.food];

export function batteryFrac(s: GameState): number | null {
  const cap = batteryCapacityWh(s.bunker);
  return cap > 0 ? s.batteryWh / cap : null;
}

export type AirQual = 'bueno' | 'cargado' | 'malo' | 'critico';
export function airQual(ppm: number): AirQual {
  if (ppm < AIR.stalePpm) return 'bueno';
  if (ppm < AIR.pelPpm) return 'cargado';
  if (ppm < AIR.stelPpm) return 'malo';
  return 'critico';
}

/** Tasa de dosis dentro del refugio (mSv/h). */
export function insideDoseRate(s: GameState): number {
  return outdoorDoseRate(s) / Math.max(1, shelterCell(s.bunker).pf);
}

export type DoseQual = 'baja' | 'media' | 'alta' | 'extrema';
export function doseQual(rateMSvH: number): DoseQual {
  if (rateMSvH < 0.01) return 'baja';
  if (rateMSvH < 0.5) return 'media';
  if (rateMSvH < 10) return 'alta';
  return 'extrema';
}

export type AlertKey = 'water' | 'food' | 'co2' | 'cold' | 'dose' | 'dehydrated' | 'starving' | 'exhausted' | 'sick' | 'battery';
export interface Alert {
  key: AlertKey;
  level: 'warn' | 'bad';
}

export function alerts(s: GameState): Alert[] {
  const out: Alert[] = [];
  const sv = s.survivor;
  if (s.stage === 'prep' || s.stage === 'briefing') return out;
  const wd = waterDays(s);
  if (wd < 2) out.push({ key: 'water', level: wd < 1 ? 'bad' : 'warn' });
  const fd = foodDays(s);
  if (fd < 2) out.push({ key: 'food', level: fd < 1 ? 'bad' : 'warn' });
  if (s.bunker.co2ppm > AIR.pelPpm) out.push({ key: 'co2', level: s.bunker.co2ppm > AIR.stelPpm ? 'bad' : 'warn' });
  if (sv.coreTempC < 36) out.push({ key: 'cold', level: sv.coreTempC < THERMO.hypothermiaC ? 'bad' : 'warn' });
  if (sv.acuteDoseMSv > DOSE.arsThreshold * 0.5) out.push({ key: 'dose', level: sv.acuteDoseMSv > DOSE.arsThreshold ? 'bad' : 'warn' });
  if (sv.waterDeficitL > WATER.deficitThirstL) out.push({ key: 'dehydrated', level: sv.waterDeficitL > WATER.deficitModerateL ? 'bad' : 'warn' });
  if (sv.kcalBalance < ENERGY.deficitWeakKcal) out.push({ key: 'starving', level: sv.kcalBalance < ENERGY.deficitSevereKcal ? 'bad' : 'warn' });
  if (sv.fatigue > 80) out.push({ key: 'exhausted', level: sv.fatigue > 92 ? 'bad' : 'warn' });
  if (sv.infection?.stage === 'activa') out.push({ key: 'sick', level: sv.infection.severity > 50 ? 'bad' : 'warn' });
  const bf = batteryFrac(s);
  if (bf !== null && bf < 0.15 && !(s.inv.diesel > 0)) out.push({ key: 'battery', level: 'warn' });
  return out;
}

/** Hidratación 0..100 para la barra (100 = sin déficit). */
export const hydrationPct = (s: GameState) => Math.max(0, 100 - (s.survivor.waterDeficitL / WATER.deficitDeathL) * 100);
/** Nutrición 0..100 (100 = sin déficit). */
export const nutritionPct = (s: GameState) => Math.max(0, Math.min(100, 100 + (s.survivor.kcalBalance / -ENERGY.deficitDeathKcal) * 100));
