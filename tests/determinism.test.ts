import { describe, it, expect } from 'vitest';
import { newGame } from '../src/core/state';
import { dispatch, type Action } from '../src/core/game';

function play(seed: string): string {
  let s = newGame(seed);
  const actions: Action[] = [
    { t: 'begin' },
    { t: 'buy', shop: 'super', cart: { garrafa_agua: 10, arroz: 4, atun: 6 } },
    { t: 'buy', shop: 'outdoor', cart: { hornillo: 1, cartuchos_gas: 2 } },
    { t: 'prep', id: 'banera' },
    { t: 'prep', id: 'encerrarse' },
  ];
  for (const a of actions) s = dispatch(s, a);
  for (let i = 0; i < 40 && s.stage !== 'dead'; i++) {
    if (s.stage === 'crisis') s = dispatch(s, { t: 'advanceDay' });
    else if (s.stage === 'event' || s.stage === 'boss') s = dispatch(s, { t: 'choose', choice: lastChoice(s) });
    else if (s.stage === 'phaseEnd') s = dispatch(s, { t: 'nextPhase' });
  }
  return JSON.stringify(s);
}
function lastChoice(s: ReturnType<typeof newGame>): string {
  // última opción: suele no requerir materiales
  return { boss_lluvia_negra: 'rutina', boss_brote: 'confiar', boss_asalto: 'negociar', boss_ola_frio: 'aguantar', boss_crecida: 'subir', boss_tormenta_g5: 'mantener' }[s.pending!.id as string] ?? pickAny(s);
}
import { ALL_CARDS } from '../src/data/cards';
import { choiceAvailable } from '../src/core/cards';
function pickAny(s: ReturnType<typeof newGame>) {
  const c = ALL_CARDS[s.pending!.id];
  return (c.choices.find((ch) => choiceAvailable(s, ch)) ?? c.choices[c.choices.length - 1]).id;
}

describe('Determinismo de partida', () => {
  it('misma semilla + mismas acciones ⇒ misma partida', () => {
    expect(play('SEMILLA1')).toBe(play('SEMILLA1'));
  });
  it('semillas distintas ⇒ partidas distintas', () => {
    expect(play('SEMILLA1')).not.toBe(play('SEMILLA2'));
  });
  it('dispatch no muta el estado de entrada', () => {
    const s = newGame('INMUTABLE');
    const before = JSON.stringify(s);
    dispatch(s, { t: 'begin' });
    expect(JSON.stringify(s)).toBe(before);
  });
});
