/** Fase 0: compras, obras y gestión del tiempo hasta el evento. */
import { CONSUMPTION, EXCAVATOR, HANDLING_H_PER_UNIT, ITEMS, PANIC, SHOPS, type ShopId } from '../data/items';
import { FATIGUE } from '../data/physiology';
import { phaseLength } from '../data/threats';
import { cellAt } from './bunker';
import { clockHour } from './env';
import { addFood } from './food';
import { clamp, log } from './log';
import { excavatorActive, progressProject } from './projects';
import type { Rng } from './rng';
import { emptyReport, simulateHour } from './sim';
import type { GameState } from './types';

export const hoursLeft = (s: GameState) => Math.max(0, s.threat.eventH - s.h);

/** Fracción de "pánico" de 0 a 1 según lo cerca que esté el evento. */
export function panic(s: GameState): number {
  const total = s.threat.eventH;
  if (total <= 0) return 1;
  return clamp(s.h / total, 0, 1);
}

export function available(s: GameState, id: string): number {
  const it = ITEMS[id];
  const hot = it.hot?.includes(s.threat.primary) ? PANIC.hotMult : 1;
  const drain = Math.min(0.97, PANIC.maxDrain * it.demand * hot * Math.pow(panic(s), 1.5));
  return Math.max(0, Math.floor(it.stock * (1 - drain)) - (s.bought[id] ?? 0));
}

export function price(s: GameState, id: string): number {
  const it = ITEMS[id];
  const surge = 1 + PANIC.priceSurge * it.demand * Math.pow(panic(s), 2);
  return Math.round(it.price * surge * 100) / 100;
}

export function cartCost(s: GameState, cart: Record<string, number>): number {
  return Object.entries(cart).reduce((t, [id, q]) => t + price(s, id) * q, 0);
}

export function tripHours(shop: ShopId, cart: Record<string, number>): number {
  const units = Object.values(cart).reduce((t, q) => t + q, 0);
  return SHOPS[shop].tripH + (shop === 'online' || shop === 'alquiler' ? 0 : units * HANDLING_H_PER_UNIT);
}

export type BuyCheck = { ok: true; cost: number; hours: number } | { ok: false; reason: 'dinero' | 'tiempo' | 'existencias' | 'vacio' };

export function checkBuy(s: GameState, shop: ShopId, cart: Record<string, number>): BuyCheck {
  const entries = Object.entries(cart).filter(([, q]) => q > 0);
  if (!entries.length) return { ok: false, reason: 'vacio' };
  for (const [id, q] of entries) if (ITEMS[id].shop !== shop || q > available(s, id)) return { ok: false, reason: 'existencias' };
  const cost = cartCost(s, cart);
  const hours = tripHours(shop, cart);
  if (cost > s.money + 1e-9) return { ok: false, reason: 'dinero' };
  if (hours > hoursLeft(s)) return { ok: false, reason: 'tiempo' };
  return { ok: true, cost, hours };
}

function receive(s: GameState, id: string, qty: number) {
  const it = ITEMS[id];
  if (it.kind === 'water') s.inv.agua = (s.inv.agua ?? 0) + (it.liters ?? 0) * qty;
  else if (it.kind === 'fuel') s.inv.diesel = (s.inv.diesel ?? 0) + (it.liters ?? 0) * qty;
  else if (it.kind === 'food') for (let i = 0; i < qty; i++) addFood(s, id, it.kcal!, s.h + it.shelfDays! * 24);
  else if (it.adds) s.inv[it.adds.id] = (s.inv[it.adds.id] ?? 0) + it.adds.n * qty;
}

/** Pasa `hours` horas en la fase 0 con una intensidad de trabajo. Puede desencadenar el evento. */
export function passPrepTime(s: GameState, rng: Rng, hours: number, work: 'ligero' | 'pesado' | 'reposo' | 'dormir', onHour?: () => void) {
  for (let i = 0; i < hours && s.stage === 'prep'; i++) {
    const sv = s.survivor;
    sv.fatigue = clamp(sv.fatigue + FATIGUE.perHour[work], 0, 100);
    onHour?.();
    s.h += 1;
    // entregas online
    for (const d of s.deliveries.filter((d) => d.atH <= s.h)) {
      receive(s, d.item, d.qty);
      log(s, 'log.entrega', { item: d.item, qty: d.qty }, 'good');
    }
    s.deliveries = s.deliveries.filter((d) => d.atH > s.h);
    if (s.h >= s.threat.eventH) startCrisis(s, rng);
    else if (sv.fatigue >= FATIGUE.collapseAt && work !== 'dormir') {
      log(s, 'log.colapso_prep', undefined, 'bad');
      passPrepTime(s, rng, Math.min(6, hoursLeft(s)), 'dormir');
      return;
    }
  }
}

export function buy(s: GameState, rng: Rng, shop: ShopId, cart: Record<string, number>): boolean {
  const chk = checkBuy(s, shop, cart);
  if (!chk.ok) return false;
  s.money -= chk.cost;
  s.stats.moneySpent += chk.cost;
  for (const [id, q] of Object.entries(cart)) {
    if (q <= 0) continue;
    s.bought[id] = (s.bought[id] ?? 0) + q;
    if (id === 'miniexcavadora') {
      s.excavatorFromH = s.h + chk.hours + EXCAVATOR.deliveryH;
      s.excavatorUntilH = s.excavatorFromH + EXCAVATOR.durationH * q;
    } else if (shop === 'online') {
      s.deliveries.push({ atH: s.h + SHOPS.online.deliveryH!, item: id, qty: q });
    } else receive(s, id, q);
  }
  log(s, 'log.compra', { shop, cost: chk.cost.toFixed(2) });
  passPrepTime(s, rng, Math.ceil(chk.hours), 'ligero');
  return true;
}

/** Horas que faltan para terminar el proyecto actual en la fase 0 (contando la excavadora). */
export function projectHoursEstimate(s: GameState): number {
  const p = s.bunker.project;
  if (!p) return 0;
  let left = p.hoursLeft;
  let h = s.h;
  let n = 0;
  while (left > 1e-6 && n < 2000) {
    left -= workRate(s, h);
    h++;
    n++;
  }
  return n;
}

function workRate(s: GameState, h: number): number {
  const p = s.bunker.project;
  if (!p) return 1;
  if (p.kind === 'excavar' && excavatorActive(s, h)) {
    const rock = cellAt(s.bunker, p.c, p.r) === 'roca';
    return rock ? EXCAVATOR.rockMult : EXCAVATOR.speedMult;
  }
  return 1;
}

/** Trabaja en el proyecto actual hasta terminarlo, hasta `maxHours` o hasta el evento. */
export function workPrep(s: GameState, rng: Rng, maxHours: number) {
  const p = s.bunker.project;
  if (!p) return;
  let done = false;
  let worked = 0;
  while (!done && worked < maxHours && s.stage === 'prep' && s.bunker.project) {
    const eff = s.survivor.fatigue > FATIGUE.slowThreshold ? 0.7 : 1;
    const rate = workRate(s, s.h) * eff;
    passPrepTime(s, rng, 1, rate > 1 ? 'ligero' : 'pesado');
    worked++;
    done = progressProject(s, rate);
    if (s.stage !== 'prep' && s.bunker.project) {
      // El evento ha llegado a mitad de obra: queda pendiente para la fase de crisis.
      break;
    }
  }
}

export type PrepActionId = 'banera' | 'bidones' | 'dormir' | 'descansar' | 'encerrarse';

export function prepAction(s: GameState, rng: Rng, id: PrepActionId) {
  switch (id) {
    case 'banera':
      if (s.inv.banera) return;
      s.inv.banera = 1;
      s.inv.aguaBruta = (s.inv.aguaBruta ?? 0) + CONSUMPTION.bathtubL;
      log(s, 'log.banera', undefined, 'good');
      passPrepTime(s, rng, 1, 'ligero');
      break;
    case 'bidones': {
      const n = s.inv.bidon_25 ?? 0;
      if (!n) return;
      s.inv.bidon_25 = 0;
      s.inv.bidon_lleno = (s.inv.bidon_lleno ?? 0) + n;
      s.inv.agua = (s.inv.agua ?? 0) + 25 * n;
      log(s, 'log.bidones', { n, l: 25 * n }, 'good');
      passPrepTime(s, rng, Math.max(1, Math.ceil(n * CONSUMPTION.bidonFillH)), 'ligero');
      break;
    }
    case 'dormir':
      passPrepTime(s, rng, Math.min(8, hoursLeft(s)), 'dormir');
      break;
    case 'descansar':
      passPrepTime(s, rng, 1, 'reposo');
      break;
    case 'encerrarse':
      log(s, 'log.encerrarse');
      passPrepTime(s, rng, hoursLeft(s), 'reposo', () => {
        // Encerrado antes de tiempo: si es de noche, duerme.
        const c = clockHour(s);
        if (c >= 23 || c < 7) s.survivor.fatigue = clamp(s.survivor.fatigue + FATIGUE.perHour.dormir - FATIGUE.perHour.reposo, 0, 100);
      });
      break;
  }
}

/** El evento llega: comienza la fase 1. Se simulan las horas hasta las 07:00 siguientes. */
export function startCrisis(s: GameState, rng: Rng) {
  if (s.stage !== 'prep') return;
  s.stage = 'crisis';
  s.phase = 1;
  s.phaseDay = 1;
  s.phaseLength = phaseLength(1);
  const lost = s.deliveries.length;
  s.deliveries = [];
  log(s, `log.evento.${s.threat.variant ?? s.threat.primary}`, undefined, 'bad');
  if (lost) log(s, 'log.entregas_perdidas', { n: lost }, 'warn');
  if (s.bunker.project?.kind === 'excavar' && s.excavatorUntilH > s.h) s.excavatorUntilH = s.h;
  s.lastReport = emptyReport(s);
  // Primeras horas: refugiarse.
  let guard = 0;
  while (clockHour(s) !== 7 && (s.stage as string) !== 'dead' && guard++ < 24) simulateHour(s, rng, 'refugio', s.lastReport);
}
