/** Agregado de modificadores de perks y oferta de 1 de 3 entre fases. */
import { NO_MODS, PERKS, PERK_IDS, PERK_OFFER, type PerkMods } from '../data/perks';
import { applyEffects } from './effects';
import { log } from './log';
import type { Rng } from './rng';
import type { GameState } from './types';

const cache = new Map<string, PerkMods>();

export function perkMods(s: GameState): PerkMods {
  const key = s.perks.join(',');
  const hit = cache.get(key);
  if (hit) return hit;
  const m: PerkMods = { ...NO_MODS };
  for (const id of s.perks) {
    const p = PERKS[id];
    if (!p) continue;
    for (const [k, v] of Object.entries(p.mods) as [keyof PerkMods, number | boolean][]) {
      if (typeof v === 'boolean') (m[k] as boolean) = (m[k] as boolean) || v;
      else if (k.endsWith('Add')) (m[k] as number) += v;
      else (m[k] as number) *= v;
    }
  }
  cache.set(key, m);
  return m;
}

export function offerPerks(s: GameState, rng: Rng) {
  const pool = PERK_IDS.filter((id) => !s.perks.includes(id));
  const offer: string[] = [];
  while (offer.length < PERK_OFFER && pool.length) {
    const id = rng.weighted(pool.map((p) => ({ item: p, w: PERKS[p].threats?.includes(s.threat.primary) ? 2 : 1 })));
    offer.push(id);
    pool.splice(pool.indexOf(id), 1);
  }
  s.perkOffer = offer;
}

export function pickPerk(s: GameState, rng: Rng, id: string): boolean {
  if (!s.perkOffer?.includes(id)) return false;
  s.perks.push(id);
  s.perkOffer = null;
  const p = PERKS[id];
  if (p.onPick) applyEffects(s, rng, p.onPick);
  log(s, 'log.perk', { perk: id }, 'good');
  return true;
}
