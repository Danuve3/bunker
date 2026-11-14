/** Despensa: comer, cocinar, caducidad. */
import { GAS } from '../data/items';
import { ITEMS } from '../data/items';
import { perkMods } from './perks';
import type { GameState } from './types';

export const totalKcal = (s: GameState) => s.food.reduce((t, b) => t + b.kcal, 0);

export function addFood(s: GameState, food: string, kcal: number, expiresH: number) {
  s.food.push({ food, kcal, expiresH });
  s.food.sort((a, b) => a.expiresH - b.expiresH);
}

/** Kcal que se pueden comer ahora (arroz y pasta solo si hay hornillo y gas). */
export function edibleKcal(s: GameState): number {
  const cook = canCook(s);
  return s.food.reduce((t, b) => t + (ITEMS[b.food]?.cook && !cook ? 0 : b.kcal), 0);
}

const canCook = (s: GameState) => (s.inv.hornillo ?? 0) > 0 && (s.inv.gas ?? 0) > 0.01;

/**
 * Come `want` kcal priorizando lo que caduca antes. Arroz y pasta necesitan hornillo,
 * gas y agua para cocerse. Devuelve las kcal ingeridas.
 */
export function eat(s: GameState, want: number): number {
  let need = want;
  const cook = canCook(s);
  for (const b of s.food) {
    if (need <= 0) break;
    if (b.kcal <= 0) continue;
    const needsCook = ITEMS[b.food]?.cook ?? false;
    if (needsCook) {
      if (!cook) continue;
      const take = Math.min(b.kcal, need);
      const gasNeed = (take / GAS.kcalCookedPerCartridge) * perkMods(s).gasMult;
      const waterNeed = take * GAS.waterPerCookedKcal;
      if ((s.inv.gas ?? 0) < gasNeed || (s.inv.agua ?? 0) + (s.inv.aguaBruta ?? 0) < waterNeed) continue;
      s.inv.gas -= gasNeed;
      // el agua de cocción puede ser no potable porque se hierve
      const raw = Math.min(s.inv.aguaBruta ?? 0, waterNeed);
      s.inv.aguaBruta -= raw;
      s.inv.agua -= waterNeed - raw;
      b.kcal -= take;
      need -= take;
    } else {
      const take = Math.min(b.kcal, need);
      b.kcal -= take;
      need -= take;
    }
  }
  s.food = s.food.filter((b) => b.kcal > 0.5);
  return want - need;
}

/** Elimina lotes caducados; devuelve kcal perdidas. */
export function spoil(s: GameState): number {
  let lost = 0;
  s.food = s.food.filter((b) => {
    if (b.expiresH <= s.h) {
      lost += b.kcal;
      return false;
    }
    return true;
  });
  return lost;
}

/** Pierde un porcentaje de la comida (roedores, saqueo...). */
export function loseFoodPct(s: GameState, pct: number): number {
  let lost = 0;
  for (const b of s.food) {
    const l = b.kcal * (pct / 100);
    b.kcal -= l;
    lost += l;
  }
  s.food = s.food.filter((b) => b.kcal > 0.5);
  return lost;
}

/** Retira `kcal` de la despensa, empezando por lo que caduca antes. */
export function removeKcal(s: GameState, kcal: number): number {
  let left = kcal;
  for (const b of s.food) {
    if (left <= 0) break;
    const take = Math.min(b.kcal, left);
    b.kcal -= take;
    left -= take;
  }
  s.food = s.food.filter((b) => b.kcal > 0.5);
  return kcal - left;
}
