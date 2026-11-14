import { describe, it, expect } from 'vitest';
import { ALL_CARDS, BOSSES, ENCOUNTERS, EVENTS } from '../src/data/cards';
import { C } from '../src/i18n';
import { SOURCES } from '../src/data/sources';
import { newGame } from '../src/core/state';
import { dispatch } from '../src/core/game';
import { nextPhase } from '../src/core/day';

describe('Contenido de cartas', () => {
  it('hay al menos 60 eventos (sin contar crisis finales)', () => {
    expect(EVENTS.length + ENCOUNTERS.length).toBeGreaterThanOrEqual(60);
  });
  it('cada amenaza tiene al menos 2 crisis finales posibles', () => {
    for (const t of ['nuclear', 'pandemia', 'colapso']) expect(BOSSES.filter((b) => !b.threats || b.threats.includes(t as never)).length).toBeGreaterThanOrEqual(3);
  });
  it('todas las cartas tienen texto, opciones con etiqueta y fuentes válidas', () => {
    for (const c of Object.values(ALL_CARDS)) {
      const t = C.cards[c.id];
      expect(t, c.id).toBeTruthy();
      expect(t.title, c.id).toBeTruthy();
      for (const ch of c.choices) expect(t.choices?.[ch.id]?.label, `${c.id}.${ch.id}`).toBeTruthy();
      if (c.fact) {
        expect(SOURCES[c.fact], c.id).toBeTruthy();
        expect(t.fact, `${c.id} fact`).toBeTruthy();
      }
      for (const ch of c.choices)
        for (const e of ch.effects) if (e.k === 'chance') for (const key of [e.textThen, e.textElse]) if (key) expect(C.cards[key]?.text, key).toBeTruthy();
    }
  });
  it('la amenaza secundaria se activa en su fase y añade su carta', () => {
    let found = false;
    for (let i = 0; i < 40 && !found; i++) {
      const s = dispatch(newGame(`SEC${i}`, { threat: 'nuclear' }), { t: 'begin' });
      if (!s.threat.secondary) continue;
      found = true;
      s.phase = s.threat.secondaryFromPhase! - 1;
      const lp = s.threat.looterPressure;
      nextPhase(s);
      expect(s.cardQueue).toContain('sec_colapso');
      expect(s.threat.looterPressure).toBeGreaterThan(lp);
    }
    expect(found).toBe(true);
  });
});
