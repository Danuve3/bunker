/** Motor de cartas: selección de eventos sin repetición temprana y resolución de decisiones. */
import { ALL_CARDS, BOSSES, EVENTS, type CardChoice, type CardData } from '../data/cards';
import { built, has } from './bunker';
import { applyEffects } from './effects';
import { totalKcal } from './food';
import { gridUp } from './env';
import { log } from './log';
import type { Rng } from './rng';
import type { GameState } from './types';

function threatMatches(s: GameState, c: CardData): boolean {
  if (!c.threats) return true;
  const t = s.threat;
  const active = [t.primary, ...(t.secondary && s.phase >= (t.secondaryFromPhase ?? 99) ? [t.secondary] : [])];
  if (!c.threats.some((x) => active.includes(x))) return false;
  if (c.variants && (!t.variant || !c.variants.includes(t.variant))) return false;
  return true;
}

export function cardEligible(s: GameState, c: CardData): boolean {
  if (!threatMatches(s, c)) return false;
  if (c.minDay && s.day < c.minDay) return false;
  if (c.minPhase && s.phase < c.minPhase) return false;
  const k = c.cond;
  if (!k) return true;
  if (k.hasModule && !has(s.bunker, k.hasModule)) return false;
  if (k.lacksModule && built(s.bunker, k.lacksModule)) return false;
  if (k.hasItem && !((s.inv[k.hasItem] ?? 0) > 0)) return false;
  if (k.minCo2 && s.bunker.co2ppm < k.minCo2) return false;
  if (k.maxMorale !== undefined && s.survivor.morale > k.maxMorale) return false;
  if (k.minFood && totalKcal(s) < k.minFood) return false;
  if (k.gridUp !== undefined && gridUp(s) !== k.gridUp) return false;
  if (k.minDose && s.survivor.acuteDoseMSv < k.minDose) return false;
  return true;
}

/** Elige un evento no visto recientemente (se permite repetir cuando se agota el pool). */
export function drawEvent(s: GameState, rng: Rng): string | null {
  const eligible = EVENTS.filter((c) => !c.encounter && cardEligible(s, c));
  if (!eligible.length) return null;
  const recent = new Set(s.eventsSeen.slice(-Math.max(1, Math.floor(eligible.length * 0.7))));
  let pool = eligible.filter((c) => !recent.has(c.id));
  if (!pool.length) pool = eligible;
  const card = rng.weighted(pool.map((c) => ({ item: c, w: c.weight ?? 1 })));
  return card.id;
}

export function drawBoss(s: GameState, rng: Rng): string {
  const pool = BOSSES.filter((c) => cardEligible(s, c));
  return rng.pick(pool.length ? pool : BOSSES.filter((c) => !c.threats)).id;
}

export function choiceAvailable(s: GameState, ch: CardChoice): boolean {
  if (ch.requiresModule && !has(s.bunker, ch.requiresModule)) return false;
  if (ch.requires) for (const [id, n] of Object.entries(ch.requires)) if (have(s, id) < n) return false;
  return true;
}

/** Cantidad disponible de un requisito. `_kcal` = comida total. */
export function have(s: GameState, id: string): number {
  return id === '_kcal' ? totalKcal(s) : (s.inv[id] ?? 0);
}

export function presentCard(s: GameState, rng: Rng, id: string) {
  const c = ALL_CARDS[id];
  s.pending = { id, kind: c.kind };
  s.stage = c.kind === 'boss' ? 'boss' : 'event';
  if (c.kind === 'event') {
    s.eventsSeen.push(id);
    s.stats.eventsSeen++;
  }
  if (c.base) applyEffects(s, rng, c.base);
}

/** Aplica la opción elegida. No cambia la etapa (lo hace el reductor). */
export function resolveChoice(s: GameState, rng: Rng, choiceId: string): boolean {
  if (!s.pending) return false;
  const c = ALL_CARDS[s.pending.id];
  const ch = c.choices.find((x) => x.id === choiceId);
  if (!ch || !choiceAvailable(s, ch)) return false;
  // Los requisitos se consumen (salvo `_kcal`, que gasta el propio efecto de comida).
  if (ch.requires) for (const [id, n] of Object.entries(ch.requires)) if (id !== '_kcal') s.inv[id] -= n;
  log(s, `card.${c.id}.${ch.id}.res`, undefined, 'info');
  applyEffects(s, rng, ch.effects);
  s.pending = null;
  return true;
}
