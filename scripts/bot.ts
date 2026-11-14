/**
 * Bots de decisión para el script de balanceo. Juegan solo a través de `dispatch`,
 * igual que la UI, así que prueban la partida real. Cada bot es una estrategia distinta
 * para detectar si alguna domina a las demás.
 */
import { dispatch, type Action } from '../src/core/game';
import { checkBuy, hoursLeft, available } from '../src/core/prep';
import { checkProject } from '../src/core/projects';
import { canDig, dugCells, has, moduleAt, storageInfo } from '../src/core/bunker';
import { choiceAvailable } from '../src/core/cards';
import { edibleKcal } from '../src/core/food';
import { estimateDose, encounterChance } from '../src/core/expedition';
import { ALL_CARDS } from '../src/data/cards';
import type { ShopId } from '../src/data/items';
import type { DayActivity, GameState, ModuleType } from '../src/core/types';

export type BotId = 'pasivo' | 'acaparador' | 'constructor' | 'explorador' | 'equilibrado';
export const BOTS: BotId[] = ['pasivo', 'acaparador', 'constructor', 'explorador', 'equilibrado'];

function tryBuy(s: GameState, shop: ShopId, want: Record<string, number>): GameState {
  if (s.stage !== 'prep') return s;
  const cart: Record<string, number> = {};
  for (const [id, q] of Object.entries(want)) {
    const n = Math.min(q, available(s, id));
    if (n > 0) cart[id] = n;
  }
  for (let guard = 0; guard < 60; guard++) {
    const chk = checkBuy(s, shop, cart);
    if (chk.ok) return dispatch(s, { t: 'buy', shop, cart });
    if (chk.reason === 'tiempo' || chk.reason === 'vacio' || chk.reason === 'existencias') return s;
    // dinero o espacio: recorta por el final
    const ids = Object.keys(cart).filter((k) => cart[k] > 0);
    if (!ids.length) return s;
    const id = ids[ids.length - 1];
    cart[id] = Math.floor(cart[id] * 0.6);
    if (!cart[id]) delete cart[id];
  }
  return s;
}

function build(s: GameState, module: ModuleType): GameState {
  if (s.stage !== 'prep' || has(s.bunker, module)) return s;
  for (const cell of dugCells(s.bunker)) {
    if (moduleAt(s.bunker, cell.c, cell.r)) continue;
    const chk = checkProject(s, 'construir', cell.c, cell.r, module);
    if (chk.ok && chk.hours < hoursLeft(s) - 2) {
      s = dispatch(s, { t: 'project', kind: 'construir', c: cell.c, r: cell.r, module });
      return dispatch(s, { t: 'work', hours: 999 });
    }
  }
  return s;
}

function dig(s: GameState, maxRow = 2): GameState {
  if (s.stage !== 'prep') return s;
  const b = s.bunker;
  for (let r = maxRow; r >= 1; r--)
    for (let c = 0; c < b.cols; c++) {
      if (!canDig(b, c, r)) continue;
      const chk = checkProject(s, 'excavar', c, r);
      if (chk.ok) {
        s = dispatch(s, { t: 'project', kind: 'excavar', c, r });
        return dispatch(s, { t: 'work', hours: Math.max(0, hoursLeft(s) - 4) });
      }
    }
  return s;
}

function rest(s: GameState): GameState {
  if (s.stage === 'prep' && s.survivor.fatigue > 55 && hoursLeft(s) > 8) s = dispatch(s, { t: 'prep', id: 'dormir' });
  return s;
}

function prep(s: GameState, bot: BotId): GameState {
  s = dispatch(s, { t: 'begin' });
  if (bot === 'pasivo') return dispatch(s, { t: 'prep', id: 'encerrarse' });
  const th = s.threat.primary;
  const cold = s.threat.variant === 'frio';
  const big = bot === 'acaparador';
  s = tryBuy(s, 'super', {
    garrafa_agua: big ? 30 : 12,
    atun: big ? 20 : 8,
    legumbres: big ? 50 : 20,
    galletas: big ? 10 : 4,
    conserva_plato: big ? 30 : 10,
    aceite: big ? 3 : 1,
    frutos_secos: 2,
    lejia: 1,
    pilas: 2,
    higiene: 1,
  });
  s = tryBuy(s, 'farmacia', { botiquin: 1, analgesicos: 2, sro: 2, ffp2: th === 'pandemia' || bot === 'explorador' ? 2 : 0 });
  s = tryBuy(s, 'outdoor', { linterna: 1, radio_dinamo: 1, hornillo: 1, cartuchos_gas: 2, saco_dormir: cold ? 1 : 0, ropa_termica: cold ? 1 : 0, filtro_agua: bot === 'explorador' ? 1 : 0 });
  const ferre: Record<string, number> = { herramientas: 1, madera: bot === 'constructor' ? 4 : 2, cemento: bot === 'constructor' ? 12 : 4 };
  if (th === 'nuclear' || th === 'pandemia' || bot === 'constructor') Object.assign(ferre, { ventilador_filtro: 1, filtro_hepa: 1, plastico_cinta: 1 });
  if (th === 'nuclear') ferre.sacos = bot === 'constructor' ? 4 : 2;
  if (th === 'colapso' || bot === 'constructor') ferre.puerta_acero = 1;
  if (bot === 'constructor') Object.assign(ferre, { inodoro_quimico: 1, deposito_500: 1 });
  if (bot === 'acaparador') ferre.deposito_500 = 1;
  s = tryBuy(s, 'ferreteria', ferre);
  s = dispatch(s, { t: 'prep', id: 'banera' });
  if (bot === 'constructor' || bot === 'equilibrado' || bot === 'acaparador') {
    if (bot !== 'acaparador' && hoursLeft(s) > 30) s = tryBuy(s, 'alquiler', { miniexcavadora: 1 });
    s = dig(s, bot === 'constructor' ? 2 : 1);
    s = rest(s);
    if (bot === 'constructor') {
      s = dig(s, 2);
      s = rest(s);
    }
  }
  if (s.inv.deposito_500) s = build(s, 'deposito_agua');
  if (s.stage === 'prep' && storageInfo(s).waterExtra > 0) s = dispatch(s, { t: 'prep', id: 'deposito' });
  if (s.inv.ventilador_filtro) s = build(s, 'ventilacion');
  if (s.inv.puerta_acero) s = build(s, 'puerta_blindada');
  if (s.inv.inodoro_quimico) s = build(s, 'letrina');
  if (s.stage === 'prep' && th === 'nuclear' && (s.inv.sacos ?? 0) >= 36 && hoursLeft(s) > 4) {
    s = dispatch(s, { t: 'project', kind: 'cubrir', c: s.bunker.entryCol, r: 1 });
    s = dispatch(s, { t: 'work', hours: 999 });
  }
  if (bot !== 'acaparador') s = tryBuy(s, 'super', { legumbres: 20, conserva_plato: 10 });
  s = rest(s);
  if (s.stage === 'prep') s = dispatch(s, { t: 'prep', id: 'encerrarse' });
  return s;
}

function expeditionTarget(s: GameState, bot: BotId): { loc: string; focus: 'comida' | 'agua' | 'medicina' } | null {
  if (bot === 'pasivo' || bot === 'acaparador') return null;
  const sv = s.survivor;
  if (sv.health < 55 || sv.fatigue > 60 || sv.injuries > 30) return null;
  const daysFood = edibleKcal(s) / 2300;
  const daysWater = (s.inv.agua ?? 0) / 3.8;
  const eager = bot === 'explorador';
  if (!eager && daysFood > 8 && daysWater > 8) return null;
  if (eager && daysFood > 20 && daysWater > 20) return null;
  // Radiación: espera a que la salida cueste poco (regla 7-10)
  if (s.threat.fallout.length && estimateDose(s, s.map[0], s.h) > (eager ? 80 : 40)) return null;
  const focus = sv.infection?.stage === 'activa' ? 'medicina' : daysWater < daysFood ? 'agua' : 'comida';
  const best = [...s.map]
    .filter((l) => l.looted < 0.85 && encounterChance(s, l) < (eager ? 0.7 : 0.5))
    .sort((a, b) => a.distKm * (1 + a.looted * 3) - b.distKm * (1 + b.looted * 3))[0];
  return best ? { loc: best.id, focus } : null;
}

function dailyPlan(s: GameState, bot: BotId): Action {
  const sv = s.survivor;
  const daysWater = (s.inv.agua ?? 0) / 3.8;
  const daysFood = edibleKcal(s) / 2300;
  const exp = expeditionTarget(s, bot);
  const smart = bot !== 'pasivo';
  const care: DayActivity | null = sv.infection?.stage === 'activa' || sv.injuries > 15 ? 'curar' : null;
  const air: DayActivity | null = smart && s.bunker.co2ppm > 4000 && !has(s.bunker, 'ventilacion') ? 'ventilar' : null;
  // Solo las acciones que ofrece la interfaz simplificada
  const morning: DayActivity = exp ? 'expedicion' : care ?? air ?? (smart ? 'trabajar' : 'descansar');
  const afternoon: DayActivity = sv.fatigue > 65 ? 'descansar' : sv.morale < 45 ? 'ocio' : air ?? (smart && s.bunker.project ? 'trabajar' : 'ocio');
  void daysWater;
  // Racionar solo cuando de verdad escasea
  const food = !smart ? 'completa' : daysFood < 3 ? 'minima' : daysFood < 7 && !exp ? 'reducida' : 'completa';
  const waterR = !smart ? 'normal' : daysWater < 3 ? 'minima' : daysWater < 6 ? 'reducida' : 'normal';
  return {
    t: 'plan',
    plan: {
      morning,
      afternoon,
      exp: exp ? { morning: exp } : undefined,
      night: smart && s.threat.looterPressure > 0.3 && s.phase >= 2 && sv.fatigue < 35 ? 'guardia' : 'dormir',
      water: waterR,
      food,
    },
  };
}

function chooseCard(s: GameState): string {
  const c = ALL_CARDS[s.pending!.id];
  const avail = c.choices.filter((ch) => choiceAvailable(s, ch));
  return (avail[0] ?? c.choices[c.choices.length - 1]).id;
}

export function playBot(s: GameState, bot: BotId, maxDays = 200): GameState {
  s = prep(s, bot);
  let guard = 0;
  while (s.stage !== 'dead' && s.day < maxDays && guard++ < 3000) {
    if (s.stage === 'crisis') {
      s = dispatch(s, dailyPlan(s, bot));
      s = dispatch(s, { t: 'advanceDay' });
    } else if (s.stage === 'event' || s.stage === 'boss') s = dispatch(s, { t: 'choose', choice: chooseCard(s) });
    else if (s.stage === 'phaseEnd') s = s.perkOffer?.length ? dispatch(s, { t: 'pickPerk', id: s.perkOffer[0] }) : dispatch(s, { t: 'nextPhase' });
    else break;
  }
  return s;
}
