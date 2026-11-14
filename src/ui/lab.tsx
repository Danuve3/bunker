/** Banco de pruebas visual (solo desarrollo: web/lab.html). No se incluye en la build. */
import { render } from 'preact';
import { newGame } from '../core/state';
import { idx } from '../core/bunker';
import type { GameState, ModuleType, ThreatId, ClimateVariant } from '../core/types';
import { BunkerView } from './bunker/BunkerCanvas';
import '@fontsource/pixelify-sans/latin-400.css';
import '@fontsource/silkscreen/latin-400.css';
import './theme.css';
import { ICONS } from './pixel/icons';
import { PixelIcon } from './components/PixelIcon';

function demo(threat: ThreatId, variant: ClimateVariant | undefined, hour: number, after: boolean, mods: ModuleType[][]): GameState {
  const s = newGame(`LAB-${threat}-${variant ?? ''}`, { threat });
  if (variant) s.threat.variant = variant;
  s.stage = after ? 'crisis' : 'prep';
  s.startClock = 0;
  s.h = after ? s.threat.eventH + 30 : 0;
  s.startClock = ((hour - (s.h % 24)) % 24 + 24) % 24;
  const b = s.bunker;
  let uid = 1;
  mods.forEach((row, ri) =>
    row.forEach((m, ci) => {
      const c = b.entryCol - 1 + ci;
      const r = ri + 1;
      if (c < 0 || c >= b.cols) return;
      b.cells[idx(b, c, r)] = 'hueco';
      if (m) b.modules.push({ uid: uid++, type: m, c, r, condition: 1, broken: m === 'radio', growth: 14 });
    }),
  );
  b.genRunning = true;
  b.coverCm[b.entryCol] = 20;
  b.coverCm[b.entryCol + 2] = 30;
  s.inv.agua = 320;
  s.batteryWh = 800;
  s.plan.lights = true;
  return s;
}

const L: ModuleType[][] = [
  ['dormitorio', '' as ModuleType, 'despensa', 'deposito_agua'],
  ['generador', 'baterias', 'ventilacion', 'letrina'],
  ['enfermeria', 'taller', 'hidroponico', 'radio'],
  ['esclusa', 'puerta_blindada', 'periscopio', 'ocio'],
  ['purificador'],
];

const scenes: [string, GameState][] = [
  ['Antes (día)', demo('nuclear', undefined, 12, false, L)],
  ['Nuclear (día)', demo('nuclear', undefined, 13, true, L)],
  ['Colapso (noche)', demo('colapso', undefined, 23, true, L)],
  ['Frío (día)', demo('clima', 'frio', 11, true, L)],
  ['Inundación (día)', demo('clima', 'inundacion', 15, true, L)],
  ['Tormenta solar (noche)', demo('clima', 'tormenta_solar', 22, true, L)],
  ['Pandemia (atardecer)', demo('pandemia', undefined, 19, true, L)],
];

render(
  <>
  <div id="icons" style={{ display: 'flex', flexWrap: 'wrap', gap: 10, padding: 12, background: '#2a231c' }}>
    {Object.keys(ICONS).map((k) => (
      <div key={k} style={{ textAlign: 'center', color: '#ccc', font: '10px system-ui' }}>
        <PixelIcon name={k} size={64} />
        <div>{k}</div>
      </div>
    ))}
  </div>
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 12, padding: 12 }}>
    {scenes.map(([t, s]) => (
      <figure key={t} style={{ margin: 0, color: '#ddd', font: '12px system-ui' }}>
        <figcaption>{t}</figcaption>
        <BunkerView s={s} />
      </figure>
    ))}
  </div>
  </>,
  document.getElementById('lab')!,
);
