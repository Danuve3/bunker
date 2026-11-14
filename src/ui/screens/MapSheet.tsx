/** Mapa de expediciones: lugares cercanos, riesgo, exposición y botín probable. */
import { useState } from 'preact/hooks';
import { encounterChance, estimateDose, estimateInfection, lootCategories, searchHours, travelHours } from '../../core/expedition';
import type { DayPlan, GameState, LootFocus } from '../../core/types';
import { C, T, fmt, num, placeName } from '../../i18n';
import { Seg, Sheet } from '../components/ui';
import { act, sheet } from '../store';

const R = 140; // radio del mapa (px de viewBox) para 3 km
/** Escala radial con raíz cuadrada: separa los lugares cercanos. */
const rad = (km: number) => Math.sqrt(km / 3) * R;

export function MapSheet({ s, slot }: { s: GameState; slot: 'morning' | 'afternoon' }) {
  const [sel, setSel] = useState<string | null>(s.plan.exp?.[slot]?.loc ?? s.map[0]?.id ?? null);
  const [focus, setFocus] = useState<LootFocus>(s.plan.exp?.[slot]?.focus ?? 'comida');
  const loc = s.map.find((l) => l.id === sel) ?? null;
  const startH = s.h + (slot === 'afternoon' ? 6 : 0);
  const nuclear = s.threat.fallout.length > 0;
  const hasDos = (s.inv.dosimetro ?? 0) > 0;
  const close = () => (sheet.value = null);
  const go = () => {
    if (!loc) return;
    act({ t: 'plan', plan: { [slot]: 'expedicion', exp: { ...s.plan.exp, [slot]: { loc: loc.id, focus } } } as Partial<DayPlan> });
    close();
  };
  const riskLv = (p: number) => (p < 0.2 ? 'bajo' : p < 0.45 ? 'medio' : 'alto');
  const lootedLv = (x: number) => (x < 0.15 ? 0 : x < 0.5 ? 1 : x < 0.85 ? 2 : 3);
  return (
    <Sheet
      title={T.map.title}
      onClose={close}
      footer={
        <button class="btn primary wide" disabled={!loc} onClick={go}>
          {fmt(T.map.go, { slot: T.map.slot[slot] })} →
        </button>
      }
    >
      <svg class="map" viewBox={`${-R - 14} ${-R - 14} ${2 * R + 28} ${2 * R + 28}`} role="group" aria-label="Mapa de los alrededores">
        <rect x={-R - 14} y={-R - 14} width={2 * R + 28} height={2 * R + 28} fill="#1b1712" />
        {[1, 2, 3].map((k) => (
          <g key={k}>
            <circle r={rad(k)} fill="none" stroke="#3e3429" stroke-dasharray="4 4" />
            <text x={rad(k) - 4} y="-3" text-anchor="end" class="map-ring">
              {k} km
            </text>
          </g>
        ))}
        <path d={`M${-R} ${R * 0.3} Q0 ${R * 0.1} ${R} ${-R * 0.2}`} stroke="#2c3c46" stroke-width="10" fill="none" opacity="0.6" />
        <rect x="-9" y="-9" width="18" height="18" rx="3" fill="#f2a93b" />
        <text y="26" text-anchor="middle" class="map-label">
          {T.map.home}
        </text>
        {s.map.map((l) => {
          const x = Math.cos(l.angle) * rad(l.distKm);
          const y = Math.sin(l.angle) * rad(l.distKm);
          const on = l.id === sel;
          return (
            <g
              key={l.id}
              transform={`translate(${x} ${y})`}
              onClick={() => setSel(l.id)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setSel(l.id))}
              class="map-pin"
              role="button"
              {...{ tabindex: 0 }}
              aria-pressed={on}
              aria-label={`${placeName(l.id, l.variant)}, ${num(l.distKm, 1)} km`}
            >
              <circle r="22" fill="transparent" />
              <circle r={on ? 15 : 12} fill={on ? '#f2a93b' : l.looted > 0.85 ? '#3a332b' : '#2a231c'} stroke={on ? '#fff' : '#8a7a66'} stroke-width="2" />
              <text y="5" text-anchor="middle" font-size="13">
                {C.places[l.type]?.icon}
              </text>
            </g>
          );
        })}
      </svg>
      {loc && (
        <div class="loc-info">
          <h3>{placeName(loc.id, loc.variant)}</h3>
          <p class="small">{fmt(T.map.dist, { d: num(loc.distKm, 1), t: num(travelHours(loc, s), 1), s: num(searchHours(loc, s), 1) })}</p>
          <p class="small">
            {T.map.loot}: {lootCategories(loc.type).map((c) => C.focus[c]).join(' · ')} — <b>{T.map.looted[lootedLv(loc.looted)]}</b>
            {loc.visits > 0 && ` · ${fmt(T.map.visits, { n: loc.visits })}`}
          </p>
          <p class="small">
            {T.map.risk}: <b>{T.map.riskLv[riskLv(encounterChance(s, loc))]}</b>
            {s.threat.infectionPressure > 0.005 && (
              <>
                {' '}
                · {T.map.infection}: <b>{num(estimateInfection(s, loc) * 100 * ((s.inv.ffp2 ?? 0) > 0 ? 0.06 : 1), 1)} %</b>
              </>
            )}
          </p>
          {nuclear && (
            <p class={`small ${estimateDose(s, loc, startH) > 100 ? 'tone-bad' : ''}`}>
              {T.map.dose}: <b>{hasDos ? `${num(estimateDose(s, loc, startH), 1)} mSv` : T.map.doseUnknown}</b>
            </p>
          )}
          {s.threat.infectionPressure > 0.005 && (s.inv.ffp2 ?? 0) > 0 && <p class="small tone-good">{fmt(T.map.mask, { n: s.inv.ffp2 })}</p>}
          <label class="field">
            <span>{T.map.focus}</span>
            <Seg label={T.map.focus} value={focus} onChange={setFocus} options={(['comida', 'agua', 'medicina', 'materiales', 'combustible'] as const).map((v) => ({ v, label: C.focus[v] }))} />
          </label>
          <p class="small muted">{T.map.carry}</p>
        </div>
      )}
    </Sheet>
  );
}
