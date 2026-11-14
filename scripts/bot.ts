/**
 * Bots de decisión para el script de balanceo. Juegan solo a través de `dispatch`,
 * igual que la UI, así que prueban la partida real.
 */
import { dispatch, type Action } from '../src/core/game';
import { checkBuy, hoursLeft, available } from '../src/core/prep';
import { checkProject } from '../src/core/projects';
import { canDig, dugCells, moduleAt } from '../src/core/bunker';
import { choiceAvailable } from '../src/core/cards';
import { totalKcal } from '../src/core/food';
import { ALL_CARDS } from '../src/data/cards';
import type { ShopId } from '../src/data/items';
import type { GameState, ModuleType } from '../src/core/types';

export type BotId = 'pasivo' | 'basico' | 'constructor';

function tryBuy(s: GameState, shop: ShopId, want: Record<string, number>): GameState {
  const cart: Record<string, number> = {};
  for (const [id, q] of Object.entries(want)) {
    const n = Math.min(q, available(s, id));
    if (n > 0) cart[id] = n;
  }
  // Reduce el carro hasta que quepa en el presupuesto
  for (let guard = 0; guard < 50; guard++) {
    const chk = checkBuy(s, shop, cart);
    if (chk.ok) return dispatch(s, { t: 'buy', shop, cart });
    if (chk.reason !== 'dinero') return s;
    const ids = Object.keys(cart).filter((k) => cart[k] > 0);
    if (!ids.length) return s;
    const id = ids[ids.length - 1];
    cart[id] = Math.floor(cart[id] / 2);
    if (!cart[id]) delete cart[id];
  }
  return s;
}

function build(s: GameState, module: ModuleType): GameState {
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

function dig(s: GameState): GameState {
  const b = s.bunker;
  // galería lateral en la fila 2 o la fila 1
  for (const r of [1, 2]) for (let c = 0; c < b.cols; c++) {
    if (!canDig(b, c, r)) continue;
    const chk = checkProject(s, 'excavar', c, r);
    if (chk.ok) {
      s = dispatch(s, { t: 'project', kind: 'excavar', c, r });
      return dispatch(s, { t: 'work', hours: Math.max(0, hoursLeft(s) - 3) });
    }
  }
  return s;
}

function prep(s: GameState, bot: BotId): GameState {
  s = dispatch(s, { t: 'begin' });
  if (bot === 'pasivo') return dispatch(s, { t: 'prep', id: 'encerrarse' });
  const th = s.threat.primary;
  const cold = s.threat.variant === 'frio';
  s = tryBuy(s, 'super', { garrafa_agua: 9, atun: 8, legumbres: 20, galletas: 4, conserva_plato: 10, frutos_secos: 2, lejia: 1, pilas: 2, higiene: 1 });
  s = tryBuy(s, 'farmacia', { botiquin: 1, analgesicos: 2, sro: 2, ffp2: th === 'pandemia' ? 2 : 0 });
  s = tryBuy(s, 'outdoor', { linterna: 1, radio_dinamo: 1, hornillo: 1, cartuchos_gas: 2, saco_dormir: cold ? 1 : 0, ropa_termica: cold ? 1 : 0 });
  const ferre: Record<string, number> = { herramientas: 1, madera: 1, cemento: 4 };
  if (th === 'nuclear' || th === 'pandemia') Object.assign(ferre, { ventilador_filtro: 1, filtro_hepa: 1, plastico_cinta: 1 });
  if (th === 'nuclear') ferre.sacos = 2;
  if (th === 'colapso') ferre.puerta_acero = 1;
  s = tryBuy(s, 'ferreteria', ferre);
  if (s.stage !== 'prep') return s;
  s = dispatch(s, { t: 'prep', id: 'banera' });
  if (s.inv.ventilador_filtro) s = build(s, 'ventilacion');
  if (s.inv.puerta_acero) s = build(s, 'puerta_blindada');
  if (bot === 'constructor' && s.stage === 'prep') {
    s = dig(s);
    if (s.stage === 'prep' && s.survivor.fatigue > 60) s = dispatch(s, { t: 'prep', id: 'dormir' });
  }
  if (s.stage === 'prep' && th === 'nuclear' && (s.inv.sacos ?? 0) >= 36 && hoursLeft(s) > 4) {
    s = dispatch(s, { t: 'project', kind: 'cubrir', c: s.bunker.entryCol, r: 0 });
    s = dispatch(s, { t: 'work', hours: 999 });
  }
  if (s.stage === 'prep' && s.survivor.fatigue > 50) s = dispatch(s, { t: 'prep', id: 'dormir' });
  if (s.stage === 'prep') s = dispatch(s, { t: 'prep', id: 'encerrarse' });
  return s;
}

function dailyPlan(s: GameState, bot: BotId): Action {
  const sv = s.survivor;
  const daysWater = (s.inv.agua ?? 0) / 3.8;
  const daysFood = totalKcal(s) / 2300;
  const morning =
    sv.infection?.stage === 'activa' || sv.injuries > 15
      ? 'curar'
      : s.bunker.co2ppm > 4000 && bot !== 'pasivo'
        ? 'ventilar'
        : (s.inv.aguaBruta ?? 0) > 10 && bot !== 'pasivo'
          ? 'potabilizar'
          : s.bunker.project && bot === 'constructor'
            ? 'construir'
            : 'mantener';
  const afternoon = sv.fatigue > 70 ? 'descansar' : sv.morale < 50 ? 'ocio' : bot === 'pasivo' ? 'descansar' : s.inv.radio_dinamo ? 'radio' : 'ocio';
  return {
    t: 'plan',
    plan: {
      morning,
      afternoon,
      night: s.threat.primary === 'colapso' && s.phase >= 2 && sv.fatigue < 40 && bot !== 'pasivo' ? 'guardia' : 'dormir',
      water: bot === 'pasivo' ? 'normal' : daysWater < 4 ? 'minima' : daysWater < 10 ? 'reducida' : 'normal',
      food: bot === 'pasivo' ? 'completa' : daysFood < 5 ? 'minima' : daysFood < 12 ? 'reducida' : 'completa',
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
  while (s.stage !== 'dead' && s.day < maxDays && guard++ < 2000) {
    if (s.stage === 'crisis') {
      s = dispatch(s, dailyPlan(s, bot));
      s = dispatch(s, { t: 'advanceDay' });
    } else if (s.stage === 'event' || s.stage === 'boss') s = dispatch(s, { t: 'choose', choice: chooseCard(s) });
    else if (s.stage === 'phaseEnd') s = dispatch(s, { t: 'nextPhase' });
    else break;
  }
  return s;
}
