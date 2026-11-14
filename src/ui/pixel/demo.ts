/** Estados de demostración para la portada y el laboratorio de arte. */
import { idx } from '../../core/bunker';
import { newGame } from '../../core/state';
import type { ClimateVariant, GameState, ModuleType, ThreatId } from '../../core/types';

export function demoState(threat: ThreatId, variant: ClimateVariant | undefined, hour: number, layout: (ModuleType | '')[][], after = true): GameState {
  const s = newGame(`DEMO-${threat}-${variant ?? ''}`, { threat });
  if (variant) s.threat.variant = variant;
  s.stage = after ? 'crisis' : 'prep';
  s.h = after ? s.threat.eventH + 30 : 0;
  s.startClock = (((hour - (s.h % 24)) % 24) + 24) % 24;
  const b = s.bunker;
  let uid = 1;
  layout.forEach((row, ri) =>
    row.forEach((m, ci) => {
      const c = b.entryCol - 1 + ci;
      const r = ri + 1;
      if (c < 0 || c >= b.cols) return;
      b.cells[idx(b, c, r)] = 'hueco';
      if (m) b.modules.push({ uid: uid++, type: m, c, r, condition: 1, broken: false, growth: 16 });
    }),
  );
  b.genRunning = true;
  s.inv.agua = 300;
  s.batteryWh = 900;
  s.plan.lights = true;
  return s;
}

/** Búnker de la portada: noche de tormenta solar con auroras. */
export const titleState = () => {
  const s = demoState('clima', 'tormenta_solar', 22, [
    ['dormitorio', '', 'despensa'],
    ['generador', 'baterias', 'hidroponico'],
    ['', 'radio', 'ocio'],
  ]);
  // Solo tres niveles bajo tierra: escena más compacta para la portada.
  const b = s.bunker;
  b.rows = 4;
  b.cells = b.cells.slice(0, b.rows * b.cols);
  return s;
};
