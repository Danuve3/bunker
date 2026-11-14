import { describe, it, expect } from 'vitest';
import { newGame } from '../src/core/state';
import { dispatch } from '../src/core/game';
import { idx, overheadPF, storageInfo } from '../src/core/bunker';
import { checkBuy, fitsStorage } from '../src/core/prep';
import { checkProject } from '../src/core/projects';

const prepState = (seed = 'OBRAS') => dispatch(newGame(seed, { threat: 'pandemia' }), { t: 'begin' });

describe('Construcción y almacén', () => {
  it('una sala vacía da 400 puntos de almacén y un módulo la reduce', () => {
    const s = prepState();
    expect(storageInfo(s).cap).toBe(400);
    s.bunker.modules.push({ uid: 99, type: 'letrina', c: s.bunker.entryCol, r: 1, condition: 1, broken: false });
    expect(storageInfo(s).cap).toBe(100);
  });
  it('no deja comprar lo que no cabe', () => {
    const s = prepState();
    s.money = 1e6;
    s.inv.agua = 395;
    expect(fitsStorage(s, { garrafa_agua: 1 })).toBe(false);
    const chk = checkBuy(s, 'super', { garrafa_agua: 1 });
    expect(chk.ok).toBe(false);
  });
  it('un depósito añade 500 L solo para agua', () => {
    const s = prepState();
    s.bunker.cells[idx(s.bunker, s.bunker.entryCol + 1, 1)] = 'hueco';
    s.bunker.modules.push({ uid: 98, type: 'deposito_agua', c: s.bunker.entryCol + 1, r: 1, condition: 1, broken: false });
    const st = storageInfo(s);
    expect(st.waterExtra).toBe(500);
    expect(st.cap).toBe(500);
  });
  it('bajo el jardín el nivel −1 protege menos que bajo la casa', () => {
    const s = prepState();
    const b = s.bunker;
    const garden = b.entryCol + 3 < b.cols ? b.entryCol + 3 : b.entryCol - 3;
    expect(overheadPF(b, garden, 1)).toBeLessThan(overheadPF(b, b.entryCol, 1));
  });
  it('excavar exige adyacencia y materiales de entibado', () => {
    const s = prepState();
    const b = s.bunker;
    expect(checkProject(s, 'excavar', 0, 5).ok).toBe(false);
    const chk = checkProject(s, 'excavar', b.entryCol + 1, 1);
    expect(chk.ok).toBe(false);
    s.inv.madera = 10;
    s.inv.cemento = 5;
    expect(checkProject(s, 'excavar', b.entryCol + 1, 1).ok).toBe(true);
  });
  it('construir un módulo consume las piezas y termina en las horas indicadas', () => {
    let s = prepState();
    s.inv.inodoro_quimico = 1;
    const c = s.bunker.entryCol;
    s = dispatch(s, { t: 'project', kind: 'construir', c, r: 1, module: 'letrina' });
    expect(s.inv.inodoro_quimico).toBe(0);
    s = dispatch(s, { t: 'work', hours: 99 });
    expect(s.bunker.modules.some((m) => m.type === 'letrina')).toBe(true);
  });
});
