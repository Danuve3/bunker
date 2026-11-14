import { describe, it, expect } from 'vitest';
import { Rng, cyrb128, dailySeed } from '../src/core/rng';

describe('PRNG determinista', () => {
  it('misma semilla ⇒ misma secuencia', () => {
    const a = Rng.fromSeed('ABC');
    const b = Rng.fromSeed('ABC');
    for (let i = 0; i < 1000; i++) expect(a.next()).toBe(b.next());
  });
  it('semillas distintas ⇒ secuencias distintas', () => {
    const a = Rng.fromSeed('ABC');
    const b = Rng.fromSeed('ABD');
    const sa = Array.from({ length: 10 }, () => a.next());
    const sb = Array.from({ length: 10 }, () => b.next());
    expect(sa).not.toEqual(sb);
  });
  it('el estado serializado reproduce la secuencia', () => {
    const a = Rng.fromSeed('X');
    a.next(); a.next();
    const b = new Rng(a.state());
    expect(b.next()).toBe(a.next());
  });
  it('rangos y distribución razonables', () => {
    const r = Rng.fromSeed('dist');
    let sum = 0;
    for (let i = 0; i < 10000; i++) {
      const v = r.int(1, 6);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(6);
      sum += v;
    }
    expect(sum / 10000).toBeGreaterThan(3.3);
    expect(sum / 10000).toBeLessThan(3.7);
  });
  it('hash estable y semilla diaria por fecha UTC', () => {
    expect(cyrb128('bunker')).toEqual(cyrb128('bunker'));
    expect(dailySeed(new Date(Date.UTC(2026, 10, 14, 23, 59)))).toBe('DIA-20261114');
  });
});
