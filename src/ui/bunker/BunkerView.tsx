/** Vista en corte lateral del búnker: cielo, casa, capas de tierra, salas y módulos. */
import { useMemo } from 'preact/hooks';
import { canDig, idx, moduleAt, shelterCell, underHouse } from '../../core/bunker';
import { clockHour, gridUp, isNight, modActive } from '../../core/env';
import { batteryFrac } from '../../core/selectors';
import type { GameState } from '../../core/types';
import { selectedCell } from '../store';
import { ModuleGlyph, Survivor } from './Glyphs';
import { WeatherCanvas, type WeatherKind } from './WeatherCanvas';

const CW = 100;
const CH = 72;
const SKY = 112;

interface Sky {
  top: string;
  bottom: string;
  ground: string;
  particles?: 'ash' | 'snow' | 'rain' | 'stars' | 'dust';
  aurora?: boolean;
  smoke?: boolean;
  flood?: boolean;
  cloud?: boolean;
}

function skyFor(s: GameState): Sky {
  const night = isNight(s);
  const after = s.h >= s.threat.eventH;
  const t = s.threat;
  if (!after) {
    // Antes del evento: cielo normal, con un tinte de inquietud a medida que se acerca.
    return night
      ? { top: '#0b1020', bottom: '#27304a', ground: '#4d5b3a', particles: 'stars' }
      : { top: '#7fa4bd', bottom: '#e2cfa6', ground: '#6b7a43' };
  }
  switch (t.variant ?? t.primary) {
    case 'nuclear':
      return night
        ? { top: '#120f0d', bottom: '#2e2621', ground: '#4b463d', particles: 'ash' }
        : { top: '#5b544c', bottom: '#a8906a', ground: '#6a6455', particles: 'ash', cloud: s.h - t.eventH < 72 };
    case 'pandemia':
      return night
        ? { top: '#0c1018', bottom: '#222a36', ground: '#4d5b3a', particles: 'stars' }
        : { top: '#9aa8b0', bottom: '#d8d3c4', ground: '#6b7a43' };
    case 'colapso':
      return night
        ? { top: '#070809', bottom: '#1b1d22', ground: '#3f4a33', smoke: true, particles: 'stars' }
        : { top: '#7d8790', bottom: '#c7b79b', ground: '#5f6b3e', smoke: true, particles: 'dust' };
    case 'frio':
      return night
        ? { top: '#0a1424', bottom: '#2b3c55', ground: '#dfe7ee', particles: 'snow' }
        : { top: '#b9cad6', bottom: '#eef3f6', ground: '#f4f7fa', particles: 'snow' };
    case 'inundacion':
      return night
        ? { top: '#0d1216', bottom: '#27323b', ground: '#3d4a3c', particles: 'rain', flood: modActive(s, 'flood') }
        : { top: '#3b4651', bottom: '#6d7b86', ground: '#4e5d45', particles: 'rain', flood: modActive(s, 'flood') };
    case 'tormenta_solar':
      return night
        ? { top: '#07101a', bottom: '#1c2a2f', ground: '#46543a', aurora: true, particles: 'stars' }
        : { top: '#8aa0ad', bottom: '#d9c9a2', ground: '#64723f' };
    default:
      return { top: '#7fa4bd', bottom: '#e2cfa6', ground: '#6b7a43' };
  }
}

/** Puntos pseudoaleatorios fijos (sin Math.random) para texturas y partículas. */
function hashPts(n: number, seed: number, w: number, h: number) {
  const out: [number, number, number][] = [];
  let x = seed * 9301 + 49297;
  for (let i = 0; i < n; i++) {
    x = (x * 9301 + 49297) % 233280;
    const a = x / 233280;
    x = (x * 9301 + 49297) % 233280;
    const b = x / 233280;
    x = (x * 9301 + 49297) % 233280;
    out.push([a * w, b * h, x / 233280]);
  }
  return out;
}

export function BunkerView({ s, buildMode = false }: { s: GameState; buildMode?: boolean }) {
  const b = s.bunker;
  const W = b.cols * CW;
  const H = SKY + (b.rows - 1) * CH;
  const sky = skyFor(s);
  const night = isNight(s);
  const shelter = shelterCell(b);
  const hour = clockHour(s);
  const sleeping = s.stage !== 'prep' && (hour >= 23 || hour < 7);
  const powered = gridUp(s) || s.batteryWh > 1 || b.genRunning;
  const lit = s.plan.lights && (powered || ((s.inv.linterna ?? 0) > 0 && (s.inv.pilas ?? 0) > 0));
  const bat = batteryFrac(s) ?? 0;
  const waterLevel = Math.min(1, (s.inv.agua ?? 0) / 500);
  const sel = selectedCell.value;
  const houseX = (b.entryCol - 1) * CW + 8;
  const HW = 3 * CW - 16;
  const stars = useMemo(() => hashPts(30, 3, W, SKY * 0.7), [W]);
  const speck = useMemo(() => hashPts(60, 11, CW, CH), []);

  const onCell = (c: number, r: number) => {
    selectedCell.value = sel && sel.c === c && sel.r === r ? null : { c, r };
  };

  const weather: WeatherKind = sky.particles === 'ash' || sky.particles === 'snow' || sky.particles === 'rain' || sky.particles === 'dust' ? sky.particles : null;
  return (
    <div class="bunker-wrap">
    <svg class="bunker" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Corte lateral del búnker. Toca una celda para excavar o construir.">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color={sky.top} />
          <stop offset="1" stop-color={sky.bottom} />
        </linearGradient>
        <linearGradient id="depth" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#000" stop-opacity="0" />
          <stop offset="1" stop-color="#000" stop-opacity="0.45" />
        </linearGradient>
        <radialGradient id="lamp" cx="0.5" cy="0.15" r="0.9">
          <stop offset="0" stop-color="#f2a93b" stop-opacity="0.35" />
          <stop offset="1" stop-color="#f2a93b" stop-opacity="0" />
        </radialGradient>
        <pattern id="p-tierra" width={CW} height={CH} patternUnits="userSpaceOnUse">
          <rect width={CW} height={CH} fill="#5a4030" />
          {speck.map(([x, y, k], i) => (
            <circle key={i} cx={x} cy={y} r={0.8 + k * 1.6} fill={k > 0.5 ? '#6e4f3a' : '#47321f'} />
          ))}
        </pattern>
        <pattern id="p-arcilla" width={CW} height={CH} patternUnits="userSpaceOnUse">
          <rect width={CW} height={CH} fill="#7a4a32" />
          {[10, 26, 42, 58].map((y) => (
            <path key={y} d={`M0 ${y} Q25 ${y - 4} 50 ${y} T100 ${y}`} stroke="#8c5a3e" stroke-width="2.5" fill="none" />
          ))}
          {speck.slice(0, 20).map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={1} fill="#5f3826" />
          ))}
        </pattern>
        <pattern id="p-roca" width={CW} height={CH} patternUnits="userSpaceOnUse">
          <rect width={CW} height={CH} fill="#5b5752" />
          <path d="M0 20 L30 14 L48 30 L80 22 L100 30 M20 72 L34 44 L48 30 M70 72 L64 48 L80 22 M48 30 L56 52 L64 48" stroke="#3f3b37" stroke-width="2" fill="none" />
          <path d="M6 40 L22 36 L26 54 L8 58 Z M84 44 L96 46 L92 62 L80 60 Z" fill="#69645e" />
        </pattern>
        <pattern id="p-obra" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="10" height="10" fill="#2b241c" />
          <rect width="4" height="10" fill="#c9a227" opacity="0.5" />
        </pattern>
      </defs>

      {/* Cielo */}
      <rect x="0" y="0" width={W} height={SKY} fill="url(#sky)" />
      {sky.particles === 'stars' &&
        stars.map(([x, y, k], i) => <circle key={i} cx={x} cy={y} r={0.6 + k} fill="#fff" opacity={0.3 + k * 0.6} />)}
      {sky.aurora && (
        <g opacity="0.55" class="aurora">
          <path d={`M0 40 Q${W * 0.25} 10 ${W * 0.5} 35 T${W} 25 V60 Q${W * 0.6} 70 ${W * 0.3} 55 T0 65 Z`} fill="#4be38a" />
          <path d={`M0 20 Q${W * 0.3} 0 ${W * 0.6} 18 T${W} 8 V30 Q${W * 0.5} 40 0 35 Z`} fill="#e0476a" opacity="0.6" />
        </g>
      )}
      {!night && !sky.particles && <circle cx={W - 80} cy={30} r={14} fill="#f6e7b0" opacity="0.85" />}
      {night && <circle cx={W - 80} cy={28} r={10} fill="#e9e4d0" opacity="0.8" />}
      {sky.cloud && (
        <g opacity="0.5" transform={`translate(70 ${SKY - 10})`}>
          <rect x="-6" y="-46" width="12" height="46" fill="#8a7a66" />
          <ellipse cx="0" cy="-54" rx="34" ry="16" fill="#8a7a66" />
        </g>
      )}
      {sky.smoke && (
        <g opacity="0.45">
          <path d={`M${W * 0.15} ${SKY} q-10 -40 10 -70 q15 -20 -5 -40`} stroke="#3a3632" stroke-width="16" fill="none" stroke-linecap="round" />
          <path d={`M${W * 0.85} ${SKY} q10 -30 -8 -60`} stroke="#3a3632" stroke-width="12" fill="none" stroke-linecap="round" />
        </g>
      )}
      {/* Casa sobre el acceso (ocupa tres columnas) */}
      <g transform={`translate(${houseX} 0)`}>
        <rect x="0" y={SKY - 56} width={HW} height="56" fill={night ? '#3a342d' : '#b8a68a'} stroke="#1a1612" stroke-width="2" />
        <path d={`M-10 ${SKY - 54} L${HW / 2} ${SKY - 100} L${HW + 10} ${SKY - 54} Z`} fill={night ? '#4a2c24' : '#8c4a36'} stroke="#1a1612" stroke-width="2" />
        <rect x={HW - 70} y={SKY - 96} width="16" height="26" fill={night ? '#3d2620' : '#6f3a2b'} stroke="#1a1612" />
        {[30, HW - 70].map((wx) => (
          <rect key={wx} x={wx} y={SKY - 44} width="34" height="22" fill={night ? (s.plan.lights ? '#3b3022' : '#141210') : '#7a9fb5'} stroke="#1a1612" />
        ))}
        <rect x={HW / 2 + 22} y={SKY - 38} width="26" height="38" fill="#5a3b28" stroke="#1a1612" />
      </g>
      {/* Sacos terreros: dentro de la casa (planta baja) o montículo en el jardín */}
      {b.coverCm.map((cm, c) => {
        const layers = Math.round((cm ?? 0) / 10);
        if (!layers) return null;
        const x0 = c * CW;
        if (underHouse(b, c))
          return (
            <g key={`cv${c}`}>
              {Array.from({ length: layers }).map((_, i) =>
                [0, 1, 2].map((j) => (
                  <rect key={`${i}-${j}`} x={x0 + 6 + j * 30 + (i % 2) * 8} y={SKY - 7 - i * 5} width="27" height="6" rx="3" fill="#a8956b" stroke="#5a4a2e" stroke-width="1" />
                )),
              )}
            </g>
          );
        const hgt = 4 + layers * 4;
        return <path key={`cv${c}`} d={`M${x0 + 2} ${SKY} Q${x0 + CW / 2} ${SKY - hgt * 2} ${x0 + CW - 2} ${SKY} Z`} fill="#6e5038" stroke="#4a3426" stroke-width="1.5" />;
      })}

      {/* Suelo y capas */}
      <rect x="0" y={SKY - 3} width={W} height="6" fill={sky.ground} />
      {sky.flood && <rect x="0" y={SKY - 12} width={W} height="12" fill="#4b6d80" opacity="0.8" class="fx-water" />}

      {Array.from({ length: b.rows - 1 }).map((_, i) => {
        const r = i + 1;
        return Array.from({ length: b.cols }).map((__, c) => {
          const k = b.cells[idx(b, c, r)];
          const x = c * CW;
          const y = SKY + 3 + i * CH;
          const m = moduleAt(b, c, r);
          const proj = b.project && b.project.c === c && b.project.r === r ? b.project : null;
          const diggable = buildMode && canDig(b, c, r) && !b.project;
          const isSel = sel && sel.c === c && sel.r === r;
          return (
            <g key={`${c}-${r}`} onClick={() => onCell(c, r)} class="cell">
              {k === 'hueco' ? (
                <g>
                  <rect x={x} y={y} width={CW} height={CH} fill={night && !lit ? '#0f0d0b' : '#221d18'} />
                  {lit && <rect x={x} y={y} width={CW} height={CH} fill="url(#lamp)" />}
                  <rect x={x} y={y + CH - 6} width={CW} height="6" fill="#3a3027" />
                  <rect x={x + 0.5} y={y + 0.5} width={CW - 1} height={CH - 1} fill="none" stroke="#8a8075" stroke-width="2" />
                  {m && (
                    <g transform={`translate(${x} ${y})`} opacity={m.broken ? 0.55 : 1}>
                      <ModuleGlyph
                        type={m.type}
                        on={!m.broken && (m.type === 'generador' ? b.genRunning : m.type === 'ventilacion' ? s.plan.fan && powered : lit)}
                        level={m.type === 'baterias' ? bat : waterLevel}
                      />
                      {m.broken && <text x="50" y="40" text-anchor="middle" class="broken-tag">⚠</text>}
                    </g>
                  )}
                  {shelter.c === c && shelter.r === r && s.stage !== 'briefing' && (
                    <g transform={`translate(${x + (m ? 18 : 0)} ${y})`}>
                      <Survivor sleeping={sleeping} />
                    </g>
                  )}
                </g>
              ) : (
                <rect x={x} y={y} width={CW} height={CH} fill={proj ? 'url(#p-obra)' : `url(#p-${k})`} />
              )}
              {proj && (
                <g>
                  <rect x={x + 10} y={y + CH / 2 - 4} width={CW - 20} height="8" rx="4" fill="#1a1612" />
                  <rect x={x + 10} y={y + CH / 2 - 4} width={(CW - 20) * (1 - proj.hoursLeft / proj.hoursTotal)} height="8" rx="4" fill="#f2a93b" />
                </g>
              )}
              {diggable && <rect x={x + 3} y={y + 3} width={CW - 6} height={CH - 6} fill="none" stroke="#f2a93b" stroke-width="2" stroke-dasharray="6 5" class="pulse" />}
              {isSel && <rect x={x + 1.5} y={y + 1.5} width={CW - 3} height={CH - 3} fill="none" stroke="#fff" stroke-width="3" />}
            </g>
          );
        });
      })}
      {/* Escalera de acceso desde la casa */}
      <g transform={`translate(${b.entryCol * CW + 6} ${SKY - 2})`}>
        <line x1="0" y1="0" x2="0" y2={CH} stroke="#8a7a66" stroke-width="2" />
        <line x1="12" y1="0" x2="12" y2={CH} stroke="#8a7a66" stroke-width="2" />
        {[8, 20, 32, 44, 56, 68].map((y) => (
          <line key={y} x1="0" y1={y} x2="12" y2={y} stroke="#8a7a66" stroke-width="2" />
        ))}
      </g>
      <rect x="0" y={SKY + 3} width={W} height={H - SKY} fill="url(#depth)" pointer-events="none" />
      {/* Profundidad */}
      {Array.from({ length: b.rows - 1 }).map((_, i) => (
        <text key={i} x={W - 4} y={SKY + 3 + i * CH + 12} text-anchor="end" class="depth-label" pointer-events="none">
          −{((i + 1) * 2.5).toFixed(1).replace('.', ',')} m
        </text>
      ))}
    </svg>
    <WeatherCanvas kind={weather} heightPct={(SKY / H) * 100} />
    </div>
  );
}
