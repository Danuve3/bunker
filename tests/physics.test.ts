import { describe, it, expect } from 'vitest';
import { newGame } from '../src/core/state';
import { outdoorDoseRate } from '../src/core/env';
import { cellPF, overheadPF, entryCap, idx } from '../src/core/bunker';
import { simulateHour, emptyReport } from '../src/core/sim';
import { Rng } from '../src/core/rng';
import { AIR, CELL_VOLUME_M3, HALF_VALUE_CM } from '../src/data/environment';
import { WATER } from '../src/data/physiology';
import type { GameState } from '../src/core/types';

function crisisState(threat: 'nuclear' | 'pandemia' | 'colapso' | 'clima' = 'nuclear'): GameState {
  const s = newGame('TEST', { threat });
  s.stage = 'crisis';
  s.phase = 1;
  s.h = s.threat.eventH;
  return s;
}

describe('Lluvia radiactiva: regla 7-10', () => {
  it('cada factor 7 de tiempo la tasa cae ~10×', () => {
    const s = crisisState('nuclear');
    const e = s.threat.eventH;
    const r7 = outdoorDoseRate(s, e + 7);
    const r49 = outdoorDoseRate(s, e + 49);
    const ratio = r7 / r49;
    expect(ratio).toBeGreaterThan(9);
    expect(ratio).toBeLessThan(11);
  });
  it('a H+1 la tasa es R1', () => {
    const s = crisisState('nuclear');
    expect(outdoorDoseRate(s, s.threat.eventH + 1)).toBeCloseTo(s.threat.fallout[0].r1, 5);
  });
});

describe('Blindaje', () => {
  it('espesores de semirreducción de Kearny', () => {
    expect(HALF_VALUE_CM.tierra).toBeCloseTo(9.1, 1);
    expect(HALF_VALUE_CM.hormigon).toBeCloseTo(6.1, 1);
  });
  it('el sótano de una casa tiene PF ~10 (orden de magnitud FEMA)', () => {
    const s = crisisState();
    const pf = overheadPF(s.bunker, s.bunker.entryCol, 1);
    expect(pf).toBeGreaterThan(6);
    expect(pf).toBeLessThan(20);
  });
  it('más tierra encima ⇒ más PF, limitado por la entrada', () => {
    const s = crisisState();
    const b = s.bunker;
    const c = b.entryCol;
    // Justo debajo del sótano solo hay una losa: poca ganancia.
    b.cells[idx(b, c, 2)] = 'hueco';
    expect(overheadPF(b, c, 2)).toBeLessThan(overheadPF(b, c, 1) * 20);
    // Una galería lateral a 2,5 m bajo tierra virgen: enorme ganancia, limitada por la entrada.
    b.cells[idx(b, c + 1, 1)] = 'tierra';
    expect(overheadPF(b, c + 1, 2)).toBeGreaterThan(overheadPF(b, c, 1) * 1000);
    expect(cellPF(b, c + 1, 2)).toBe(entryCap(b));
    // 30 cm de sacos terreros (~3,3 semirreducciones) multiplican el PF del sótano ~10×.
    const before = overheadPF(b, c, 1);
    b.coverCm[c] = 30;
    expect(overheadPF(b, c, 1) / before).toBeCloseTo(Math.pow(2, 30 / 9.1), 3);
  });
});

describe('Aire', () => {
  it('sin ventilación el CO₂ sube hacia el equilibrio de infiltración', () => {
    const s = crisisState('colapso');
    s.plan.fan = false;
    const rng = new Rng(s.rng);
    const r = emptyReport(s);
    for (let i = 0; i < 72; i++) simulateHour(s, rng, 'descansar', r);
    const V = CELL_VOLUME_M3;
    const eq = AIR.outdoorPpm + (AIR.co2KgPerDay / 24 / AIR.co2DensityKgM3 / (AIR.leakAch * V)) * 1e6;
    expect(s.bunker.co2ppm).toBeGreaterThan(eq * 0.95);
    expect(s.bunker.co2ppm).toBeLessThan(eq * 1.05);
  });
  it('la bomba manual baja el CO₂', () => {
    const s = crisisState('colapso');
    s.bunker.co2ppm = 9000;
    const rng = new Rng(s.rng);
    const r = emptyReport(s);
    for (let i = 0; i < 6; i++) simulateHour(s, rng, 'ventilar', r);
    expect(s.bunker.co2ppm).toBeLessThan(2000);
  });
});

describe('Consumo de agua', () => {
  it('ración normal ≈ 3,8 L/día (FEMA) sin red de agua', () => {
    const s = crisisState('colapso');
    s.h = s.threat.waterMainsUntilH + 1;
    s.inv.agua = 100;
    s.inv.aguaBruta = 0;
    const rng = new Rng(s.rng);
    const r = emptyReport(s);
    for (let i = 0; i < 24; i++) simulateHour(s, rng, 'descansar', r);
    const used = 100 - s.inv.agua;
    expect(used).toBeGreaterThan(WATER.rations.normal.drink + WATER.rations.normal.hygiene - 0.3);
    expect(used).toBeLessThan(4.6);
  });
  it('sin agua se muere en ~3-5 días (regla de 3)', () => {
    const s = crisisState('colapso');
    s.h = s.threat.waterMainsUntilH + 1;
    s.inv.agua = 0;
    s.inv.aguaBruta = 0;
    const rng = new Rng(s.rng);
    const r = emptyReport(s);
    let hoursAlive = 0;
    while (s.stage !== 'dead' && hoursAlive < 24 * 10) {
      simulateHour(s, rng, 'descansar', r);
      hoursAlive++;
    }
    expect(s.deathCause).toBe('deshidratacion');
    expect(hoursAlive / 24).toBeGreaterThan(2.5);
    expect(hoursAlive / 24).toBeLessThan(5.5);
  });
});
