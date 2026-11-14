/** Expediciones al exterior: mapa procedural, exposición, botín y encuentros. */
import { DEFAULT_WEIGHT, EXPEDITION, LOCATIONS, LOC_TYPES, WEIGHT, type LocType } from '../data/locations';
import { phasePressure } from '../data/threats';
import { ENCOUNTERS } from '../data/cards';
import { cardEligible } from './cards';
import { outdoorDoseRate, outdoorInfection } from './env';
import { addFood } from './food';
import { log } from './log';
import { perkMods } from './perks';
import type { Rng } from './rng';
import type { ExpPlan, GameState, Location, LootFocus } from './types';

export function generateMap(rng: Rng): Location[] {
  const out: Location[] = [];
  for (const type of LOC_TYPES) {
    const d = LOCATIONS[type];
    const n = rng.int(d.count[0], d.count[1]);
    for (let i = 0; i < n; i++) {
      out.push({
        id: `${type}${i}`,
        type,
        variant: rng.int(0, 2),
        distKm: Math.round(rng.range(d.distKm[0], d.distKm[1]) * 10) / 10,
        angle: rng.range(0, Math.PI * 2),
        looted: 0,
        visits: 0,
      });
    }
  }
  return out.sort((a, b) => a.distKm - b.distKm);
}

export const travelHours = (loc: Location, s?: GameState) => (2 * loc.distKm) / (EXPEDITION.walkKmH * (s ? perkMods(s).travelMult : 1));
export const searchHours = (loc: Location, s?: GameState) => Math.max(0.5, EXPEDITION.franjaH - travelHours(loc, s));

/** Factor de dosis fuera: mitad en la calle (PF 1), mitad dentro de edificios. */
export function exposureFactor(loc: Location): number {
  const d = LOCATIONS[loc.type as LocType];
  return EXPEDITION.streetFrac + (1 - EXPEDITION.streetFrac) / d.buildingPF;
}

/** Dosis estimada (mSv) de una expedición que empieza a la hora absoluta `fromH`. */
export function estimateDose(s: GameState, loc: Location, fromH: number): number {
  let d = 0;
  for (let i = 0; i < EXPEDITION.franjaH; i++) d += outdoorDoseRate(s, fromH + i);
  return d * exposureFactor(loc);
}

/** Probabilidad aproximada de contagio en la expedición (sin mascarilla). */
export function estimateInfection(s: GameState, loc: Location): number {
  const p = outdoorInfection(s) * LOCATIONS[loc.type as LocType].infectionMult;
  return 1 - Math.pow(1 - p, EXPEDITION.franjaH);
}

export function encounterChance(s: GameState, loc: Location): number {
  const d = LOCATIONS[loc.type as LocType];
  const hot = d.hot?.includes(s.threat.primary) ? 1.5 : 1;
  return Math.min(0.85, d.encounter * hot * (0.5 + s.threat.looterPressure * 2) * phasePressure(Math.max(1, s.phase)) * perkMods(s).encounterMult);
}

const weightOf = (id: string) => WEIGHT[id] ?? DEFAULT_WEIGHT;

export function beginExpedition(s: GameState, plan: ExpPlan) {
  const masked = (s.inv.ffp2 ?? 0) >= 1 && s.threat.infectionPressure > 0.005;
  if (masked) s.inv.ffp2 -= 1;
  s.away = { loc: plan.loc, masked };
}

/** Botín al volver. Devuelve una cadena "id:n;id:n" para el diario. */
export function finishExpedition(s: GameState, rng: Rng, plan: ExpPlan) {
  const loc = s.map.find((l) => l.id === plan.loc);
  s.away = null;
  if (!loc || s.stage === 'dead') return;
  const data = LOCATIONS[loc.type as LocType];
  const pm = perkMods(s);
  const frac = Math.min(1, searchHours(loc, s) / EXPEDITION.fullSearchH);
  const avail = 1 - loc.looted;
  let carry = EXPEDITION.carryKg + pm.carryKgAdd;
  const order = [...data.loot].sort((a, b) => Number(b.cat === plan.focus) - Number(a.cat === plan.focus));
  const got: string[] = [];
  for (const e of order) {
    const pFind = e.p * Math.sqrt(avail) * Math.min(1, frac + 0.25) * (e.cat === plan.focus ? 1.25 : 1);
    if (!rng.chance(Math.min(0.95, pFind))) continue;
    let n = rng.int(e.min, e.max) * Math.max(0.3, frac) * (0.4 + 0.6 * avail) * pm.lootMult;
    n = Math.floor(Math.min(n, carry / weightOf(e.id)));
    if (n <= 0) continue;
    carry -= n * weightOf(e.id);
    if (e.id === 'food') addFood(s, e.food ?? 'conserva_plato', n, s.h + 24 * (e.food === 'fresco' ? 6 : 365));
    else s.inv[e.id] = (s.inv[e.id] ?? 0) + n;
    got.push(`${e.id}:${n}`);
  }
  loc.looted = Math.min(1, loc.looted + EXPEDITION.depletionPerFullSearch * frac);
  loc.visits++;
  s.stats.expeditions++;
  s.visibility += EXPEDITION.visibilityPerTrip;
  log(s, got.length ? 'log.botin' : 'log.sin_botin', { loot: got.join(';'), place: loc.id }, got.length ? 'good' : 'warn');
  if (rng.chance(data.injury)) {
    s.survivor.injuries = Math.min(100, s.survivor.injuries + rng.int(8, 20) * pm.injuryMult);
    log(s, 'log.herida_fuera', undefined, 'warn');
  }
  if (!s.pendingEncounter && rng.chance(encounterChance(s, loc))) {
    const pool = ENCOUNTERS.filter((c) => cardEligible(s, c));
    if (pool.length) s.pendingEncounter = rng.weighted(pool.map((c) => ({ item: c.id, w: c.weight ?? 1 })));
  }
}

export function lootCategories(type: string): LootFocus[] {
  return [...new Set(LOCATIONS[type as LocType].loot.map((l) => l.cat))];
}
