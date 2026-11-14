import { describe, it, expect } from 'vitest';
import { newGame } from '../src/core/state';
import { dispatch } from '../src/core/game';
import { estimateDose, finishExpedition, beginExpedition } from '../src/core/expedition';
import { insideDoseRate } from '../src/core/selectors';
import { outdoorDoseRate } from '../src/core/env';
import { Rng } from '../src/core/rng';
import { totalKcal } from '../src/core/food';
import { EXPEDITION, WEIGHT } from '../src/data/locations';

function crisis(threat: 'nuclear' | 'colapso' = 'nuclear', seed = 'EXP') {
  let s = newGame(seed, { threat });
  s = dispatch(s, { t: 'begin' });
  s = dispatch(s, { t: 'prep', id: 'encerrarse' });
  return s;
}

describe('Expediciones', () => {
  it('el mapa tiene lugares a menos de 3 km', () => {
    const s = newGame('MAPA');
    expect(s.map.length).toBeGreaterThanOrEqual(6);
    for (const l of s.map) expect(l.distKm).toBeLessThanOrEqual(3);
  });
  it('salir expone mucho más que quedarse dentro', () => {
    const s = crisis('nuclear');
    const loc = s.map[0];
    const inside = insideDoseRate(s) * EXPEDITION.franjaH;
    expect(estimateDose(s, loc, s.h)).toBeGreaterThan(inside * 3);
  });
  it('esperar reduce la dosis de una salida (regla 7-10)', () => {
    const s = crisis('nuclear');
    const loc = s.map[0];
    expect(estimateDose(s, loc, s.h + 24 * 14)).toBeLessThan(estimateDose(s, loc, s.h) / 5);
    expect(outdoorDoseRate(s, s.h + 24 * 14)).toBeLessThan(outdoorDoseRate(s, s.h));
  });
  it('el botín respeta la carga máxima y agota el lugar', () => {
    const s = crisis('colapso', 'BOTIN');
    const loc = s.map.find((l) => l.type === 'super') ?? s.map[0];
    const before = { kcal: totalKcal(s), agua: s.inv.agua ?? 0 };
    const rng = new Rng(s.rng);
    beginExpedition(s, { loc: loc.id, focus: 'comida' });
    finishExpedition(s, rng, { loc: loc.id, focus: 'comida' });
    const kg = (totalKcal(s) - before.kcal) * WEIGHT.food + ((s.inv.agua ?? 0) - before.agua);
    expect(kg).toBeLessThanOrEqual(EXPEDITION.carryKg + 3);
    expect(loc.looted).toBeGreaterThan(0);
    expect(s.away).toBeNull();
  });
  it('una expedición planificada se ejecuta y no se repite sola', () => {
    let s = crisis('colapso', 'PLAN');
    const loc = s.map[0];
    s = dispatch(s, { t: 'plan', plan: { morning: 'expedicion', exp: { morning: { loc: loc.id, focus: 'agua' } } } });
    s = dispatch(s, { t: 'advanceDay' });
    expect(s.stats.expeditions).toBe(1);
    expect(s.plan.morning).toBe('descansar');
  });
});
