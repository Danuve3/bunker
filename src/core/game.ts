/**
 * Reductor de la partida: (estado, acción) → nuevo estado.
 * Clona el estado, recrea el PRNG desde su estado serializado y lo vuelve a guardar.
 * La UI solo habla con la simulación a través de `dispatch`.
 */
import type { ShopId } from '../data/items';
import { SCORE } from '../data/threats';
import { runBossDay, runDay, nextPhase } from './day';
import { presentCard, resolveChoice } from './cards';
import { ALL_CARDS } from '../data/cards';
import { log } from './log';
import { buy, prepAction, workPrep, hoursLeft, type PrepActionId } from './prep';
import { cancelProject, startProject } from './projects';
import { Rng } from './rng';
import type { DayPlan, GameState, ModuleType, ProjectKind } from './types';

export type Action =
  | { t: 'begin' }
  | { t: 'buy'; shop: ShopId; cart: Record<string, number> }
  | { t: 'prep'; id: PrepActionId }
  | { t: 'project'; kind: ProjectKind; c: number; r: number; module?: ModuleType }
  | { t: 'cancelProject' }
  | { t: 'work'; hours: number }
  | { t: 'plan'; plan: Partial<DayPlan> }
  | { t: 'advanceDay' }
  | { t: 'choose'; choice: string }
  | { t: 'nextPhase' };

export function dispatch(state: GameState, a: Action): GameState {
  if (state.stage === 'dead') return state;
  const s = structuredClone(state);
  const rng = new Rng(s.rng);
  switch (a.t) {
    case 'begin':
      if (s.stage === 'briefing') {
        s.stage = 'prep';
        log(s, 'log.inicio', { h: hoursLeft(s) });
      }
      break;
    case 'buy':
      if (s.stage === 'prep') buy(s, rng, a.shop, a.cart);
      break;
    case 'prep':
      if (s.stage === 'prep') prepAction(s, rng, a.id);
      break;
    case 'project':
      if (s.stage === 'prep' || s.stage === 'crisis') startProject(s, a.kind, a.c, a.r, a.module);
      break;
    case 'cancelProject':
      cancelProject(s);
      break;
    case 'work':
      if (s.stage === 'prep') workPrep(s, rng, a.hours);
      break;
    case 'plan':
      s.plan = { ...s.plan, ...a.plan };
      break;
    case 'advanceDay':
      if (s.stage === 'crisis') runDay(s, rng);
      break;
    case 'choose':
      if ((s.stage === 'event' || s.stage === 'boss') && s.pending) {
        const wasBoss = s.pending.kind === 'boss';
        if (resolveChoice(s, rng, a.choice)) {
          if (wasBoss) runBossDay(s, rng);
          else s.stage = 'crisis';
          // Cartas en cola (p. ej., un encuentro y después la crisis final)
          const next = s.cardQueue.shift();
          if (next && (s.stage as string) !== 'dead') {
            if ((s.stage as string) === 'phaseEnd' && ALL_CARDS[next].kind !== 'boss') s.cardQueue.unshift(next);
            else presentCard(s, rng, next);
          }
        }
      }
      break;
    case 'nextPhase':
      if (s.stage === 'phaseEnd') {
        nextPhase(s);
        const next = s.cardQueue.shift();
        if (next) presentCard(s, rng, next);
      }
      break;
  }
  s.rng = rng.state();
  return s;
}

export function score(s: GameState): number {
  let pts = s.day * SCORE.perDay + Math.max(0, s.phase - 1) * SCORE.perPhase + s.stats.bossesBeaten * SCORE.perBoss;
  if (s.threat.primary === 'nuclear' && s.day > 0 && s.survivor.doseMSv < 100) pts += SCORE.lowDoseBonus;
  return Math.round(pts);
}
