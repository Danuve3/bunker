/** Mapa de expediciones: lugares cercanos, riesgo, exposición y botín probable. */
import { useState } from 'preact/hooks';
import { encounterChance, estimateDose, estimateInfection, lootCategories, searchHours, travelHours } from '../../core/expedition';
import type { DayPlan, GameState, LootFocus } from '../../core/types';
import { C, T, fmt, num, placeName } from '../../i18n';
import { Seg, Sheet } from '../components/ui';
import { PixelCanvas } from '../components/PixelCanvas';
import { MAP, MapRenderer, locPosIn } from '../pixel/map';
import { act, sheet } from '../store';
import { PixelIcon } from '../components/PixelIcon';

const mapR = new MapRenderer();

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
      <div class="map-wrap">
        <PixelCanvas w={MAP} h={MAP} class="map" label="Mapa de los alrededores" draw={(cv, t) => mapR.render(cv, s, sel, t)} deps={[s, sel]} />
        {s.map.map((l) => {
          const p = locPosIn(s.map, l);
          return (
            <button
              key={l.id}
              class={`map-hit ${l.id === sel ? 'on' : ''}`}
              style={{ left: `${(p.x / MAP) * 100}%`, top: `${(p.y / MAP) * 100}%` }}
              aria-pressed={l.id === sel}
              aria-label={`${placeName(l.id, l.variant)}, ${num(l.distKm, 1)} km`}
              onClick={() => setSel(l.id)}
            />
          );
        })}
      </div>
      {loc && (
        <div class="loc-info">
          <h3 class="loc-title">
            <PixelIcon name={loc.type} size={24} /> {placeName(loc.id, loc.variant)}
          </h3>
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
            <Seg label={T.map.focus} value={focus} onChange={setFocus} options={(['comida', 'agua', 'medicina', 'materiales'] as const).map((v) => ({ v, label: C.focus[v] }))} />
          </label>
          <p class="small muted">{T.map.carry}</p>
        </div>
      )}
    </Sheet>
  );
}
