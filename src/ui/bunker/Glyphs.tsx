/** Dibujos vectoriales de cada módulo, en una caja de 100 × 72. */
import type { ModuleType } from '../../core/types';

interface P {
  on?: boolean;
  level?: number; // 0..1 (agua, batería)
}

const S = { stroke: '#1a1612', strokeWidth: 1.5, strokeLinejoin: 'round' as const };

export function ModuleGlyph({ type, on, level = 0.6 }: P & { type: ModuleType }) {
  switch (type) {
    case 'dormitorio':
      return (
        <g {...S}>
          <rect x="18" y="20" width="4" height="44" fill="#6b5641" />
          <rect x="78" y="20" width="4" height="44" fill="#6b5641" />
          <rect x="20" y="30" width="60" height="7" fill="#7d6a52" />
          <rect x="24" y="24" width="50" height="7" rx="3" fill="#a8473f" />
          <rect x="20" y="54" width="60" height="7" fill="#7d6a52" />
          <rect x="24" y="48" width="50" height="7" rx="3" fill="#4f6d7a" />
          <rect x="25" y="46" width="12" height="5" rx="2" fill="#e8ddc8" />
        </g>
      );
    case 'despensa':
      return (
        <g {...S}>
          <rect x="16" y="14" width="68" height="52" fill="#4a3b2c" />
          {[24, 40, 56].map((y) => (
            <g key={y}>
              <rect x="16" y={y + 6} width="68" height="3" fill="#8a6f50" />
              {[22, 32, 42, 52, 62, 72].map((x, i) => (
                <rect key={x} x={x} y={y - 4} width="7" height="10" rx="1" fill={['#c9a227', '#b5483b', '#7a9a5a', '#d6c7a1'][(i + y) % 4]} />
              ))}
            </g>
          ))}
        </g>
      );
    case 'deposito_agua':
      return (
        <g {...S}>
          <rect x="26" y="12" width="48" height="54" rx="10" fill="#3f5866" />
          <rect x="28" y={14 + 50 * (1 - level)} width="44" height={Math.max(0, 50 * level)} rx="8" fill="#5ea3c7" stroke="none" />
          <line x1="26" y1="30" x2="74" y2="30" stroke="#2c3e48" />
          <line x1="26" y1="48" x2="74" y2="48" stroke="#2c3e48" />
          <rect x="72" y="56" width="10" height="4" fill="#9aa5ab" />
        </g>
      );
    case 'generador':
      return (
        <g {...S} class={on ? 'g-shake' : ''}>
          <rect x="18" y="32" width="64" height="32" rx="3" fill="#c46b2b" />
          <rect x="24" y="38" width="22" height="18" fill="#2a2420" />
          {[40, 45, 50].map((y) => (
            <line key={y} x1="52" y1={y} x2="76" y2={y} stroke="#7a3f18" stroke-width="2" />
          ))}
          <rect x="70" y="10" width="5" height="24" fill="#6d6d6d" />
          {on && <circle cx="72" cy="7" r="4" fill="#9a948c" opacity="0.6" class="g-smoke" stroke="none" />}
          <circle cx="35" cy="47" r="5" fill={on ? '#f2a93b' : '#4a4038'} />
        </g>
      );
    case 'baterias':
      return (
        <g {...S}>
          {[20, 52].map((x) => (
            <g key={x}>
              <rect x={x} y="26" width="28" height="38" rx="2" fill="#2d3b30" />
              <rect x={x + 4} y="21" width="6" height="5" fill="#b33" />
              <rect x={x + 18} y="21" width="6" height="5" fill="#333" />
              <rect x={x + 4} y={60 - 30 * level} width="20" height={30 * level} fill="#7fb069" stroke="none" />
            </g>
          ))}
        </g>
      );
    case 'ventilacion':
      return (
        <g {...S}>
          <rect x="44" y="0" width="12" height="20" fill="#8c8c8c" />
          <rect x="28" y="20" width="44" height="44" rx="4" fill="#5b6066" />
          <circle cx="50" cy="42" r="17" fill="#2b2e31" />
          <g class={on ? 'g-spin' : ''} style={{ transformOrigin: '50px 42px' }}>
            {[0, 90, 180, 270].map((a) => (
              <path key={a} d="M50 42 L46 28 Q50 25 54 28 Z" fill="#b9c2c9" transform={`rotate(${a} 50 42)`} />
            ))}
          </g>
          <circle cx="50" cy="42" r="3" fill="#ddd" />
        </g>
      );
    case 'letrina':
      return (
        <g {...S}>
          <rect x="40" y="18" width="22" height="20" rx="3" fill="#e6e1d6" />
          <path d="M32 40 H70 Q70 56 56 58 L56 64 H44 L44 58 Q32 56 32 40 Z" fill="#f2eee6" />
          <rect x="70" y="30" width="12" height="34" fill="#6b5641" />
        </g>
      );
    case 'esclusa':
      return (
        <g {...S}>
          <rect x="16" y="8" width="68" height="4" fill="#777" />
          {[20, 34, 48, 62, 76].map((x, i) => (
            <rect key={x} x={x - 4} y="12" width="10" height="52" fill={i % 2 ? '#d8d2c0' : '#b8b2a0'} opacity="0.75" />
          ))}
          <path d="M12 64 H88" stroke="#c9a227" stroke-width="3" stroke-dasharray="6 4" />
        </g>
      );
    case 'puerta_blindada':
      return (
        <g {...S}>
          <rect x="30" y="8" width="40" height="58" rx="3" fill="#6f7479" />
          <rect x="34" y="12" width="32" height="50" rx="2" fill="#80868c" />
          <circle cx="50" cy="37" r="10" fill="none" stroke="#c9a227" stroke-width="3" />
          <line x1="40" y1="37" x2="60" y2="37" stroke="#c9a227" stroke-width="3" />
          <line x1="50" y1="27" x2="50" y2="47" stroke="#c9a227" stroke-width="3" />
        </g>
      );
    case 'ocio':
      return (
        <g {...S}>
          <path d="M22 44 Q22 32 34 32 H58 Q70 32 70 44 V58 H22 Z" fill="#7a3b3b" />
          <rect x="18" y="44" width="10" height="16" rx="3" fill="#8f4747" />
          <rect x="64" y="44" width="10" height="16" rx="3" fill="#8f4747" />
          <line x1="82" y1="20" x2="82" y2="62" stroke="#444" stroke-width="2" />
          <path d="M74 20 H90 L86 10 H78 Z" fill={on ? '#f2c46b' : '#a89a85'} />
          {on && <circle cx="82" cy="22" r="14" fill="#f2a93b" opacity="0.18" stroke="none" />}
          <rect x="36" y="20" width="16" height="10" fill="#c9a227" />
        </g>
      );
    case 'purificador':
      return (
        <g {...S}>
          <rect x="34" y="10" width="32" height="24" rx="4" fill="#9fb8c4" />
          <rect x="34" y="38" width="32" height="24" rx="4" fill="#5ea3c7" />
          <rect x="47" y="34" width="6" height="4" fill="#666" />
          <path d="M50 44 Q44 52 50 56 Q56 52 50 44 Z" fill="#e8f4fa" />
        </g>
      );
    case 'radio':
      return (
        <g {...S}>
          <rect x="24" y="34" width="52" height="28" rx="4" fill="#3d4a3f" />
          <circle cx="38" cy="48" r="8" fill="#1f2620" />
          <rect x="52" y="42" width="18" height="6" fill="#9be564" />
          <line x1="70" y1="34" x2="82" y2="8" stroke="#aaa" stroke-width="2" />
        </g>
      );
    case 'enfermeria':
      return (
        <g {...S}>
          <rect x="20" y="40" width="60" height="10" fill="#e6e1d6" />
          <rect x="22" y="50" width="4" height="14" fill="#888" />
          <rect x="74" y="50" width="4" height="14" fill="#888" />
          <rect x="40" y="12" width="20" height="20" rx="3" fill="#fff" />
          <rect x="47" y="15" width="6" height="14" fill="#c33" stroke="none" />
          <rect x="43" y="19" width="14" height="6" fill="#c33" stroke="none" />
        </g>
      );
    case 'taller':
      return (
        <g {...S}>
          <rect x="16" y="40" width="68" height="8" fill="#7d6a52" />
          <rect x="20" y="48" width="5" height="16" fill="#6b5641" />
          <rect x="75" y="48" width="5" height="16" fill="#6b5641" />
          <rect x="24" y="14" width="52" height="22" fill="#4a3b2c" />
          <path d="M32 18 V32 M42 18 L48 32 M58 20 H70" stroke="#c9c2b4" stroke-width="2.5" />
        </g>
      );
    case 'hidroponico':
      return (
        <g {...S}>
          <rect x="16" y="8" width="68" height="6" fill={on ? '#c77dff' : '#555'} />
          {[24, 44].map((y) => (
            <g key={y}>
              <rect x="18" y={y + 12} width="64" height="6" fill="#ddd" />
              {[24, 36, 48, 60, 72].map((x) => (
                <path key={x} d={`M${x} ${y + 12} q-5 -8 0 -12 q5 4 0 12`} fill="#6fbf5a" />
              ))}
            </g>
          ))}
        </g>
      );
    case 'periscopio':
      return (
        <g {...S}>
          <rect x="46" y="0" width="8" height="50" fill="#666" />
          <rect x="38" y="46" width="24" height="12" rx="2" fill="#555" />
          <circle cx="50" cy="52" r="3" fill="#6fb3d2" />
        </g>
      );
  }
}

/** Superviviente: de pie o dormido. */
export function Survivor({ sleeping }: { sleeping: boolean }) {
  if (sleeping)
    return (
      <g class="surv">
        <rect x="28" y="56" width="46" height="8" rx="4" fill="#4f6d7a" stroke="#1a1612" />
        <circle cx="30" cy="54" r="5" fill="#e0b48a" stroke="#1a1612" />
        <text x="78" y="44" fill="#ece4d4" font-size="10" class="zz">z</text>
      </g>
    );
  return (
    <g class="surv" stroke="#1a1612" stroke-width="1.5">
      <circle cx="50" cy="26" r="6" fill="#e0b48a" />
      <path d="M43 34 H57 L59 52 H41 Z" fill="#b5483b" />
      <rect x="43" y="52" width="5" height="12" fill="#3b4651" />
      <rect x="52" y="52" width="5" height="12" fill="#3b4651" />
    </g>
  );
}
