/** Fase de crisis: plan del día, estado y vista del búnker. */
import { useState } from 'preact/hooks';
import { has } from '../../core/bunker';
import { clockHour } from '../../core/env';
import type { DayActivity, DayPlan, GameState, NightActivity } from '../../core/types';
import { C, T, fmt, logText, moduleName, num, placeName } from '../../i18n';
import { MapSheet } from './MapSheet';
import { BunkerView } from '../bunker/BunkerView';
import { AlertBar, ResourceChips, SurvivorPanel } from '../components/Hud';
import { Seg, Sheet, Toggle } from '../components/ui';
import { act, selectedCell, sheet, showReport } from '../store';
import { CellSheet } from './CellSheet';
import { TopBar } from './TopBar';

const DAY_ACTS: DayActivity[] = ['expedicion', 'mantener', 'descansar', 'ocio', 'radio', 'ventilar', 'construir', 'potabilizar', 'curar', 'vigilar'];
const NIGHT_ACTS: NightActivity[] = ['dormir', 'guardia'];

function ActPicker({ s, slot }: { s: GameState; slot: 'morning' | 'afternoon' | 'night' }) {
  const acts = slot === 'night' ? NIGHT_ACTS : DAY_ACTS.filter((a) => a !== 'expedicion' || s.map.length > 0);
  const close = () => (sheet.value = null);
  return (
    <Sheet title={T.plan[slot]} onClose={close}>
      <ul class="act-list">
        {acts.map((a) => {
          const disabled = (a === 'radio' && !(s.inv.radio_dinamo > 0) && !has(s.bunker, 'radio')) || (a === 'construir' && !s.bunker.project);
          return (
            <li key={a}>
              <button
                class={`btn wide ${s.plan[slot] === a ? 'selected' : ''}`}
                disabled={disabled}
                onClick={() => {
                  if (a === 'expedicion') {
                    sheet.value = `map:${slot}`;
                    return;
                  }
                  act({ t: 'plan', plan: { [slot]: a } as Partial<DayPlan> });
                  close();
                }}
              >
                <b>{T.plan.acts[a]}</b>
                <span class="small">{T.plan.actsDesc[a]}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}

function LogSheet({ s }: { s: GameState }) {
  const entries = s.log.slice(-60).reverse();
  return (
    <Sheet title={T.report.log} onClose={() => (sheet.value = null)}>
      <ul class="log">
        {entries.map((e, i) => (
          <li key={i} class={`tone-${e.tone}`}>
            <span class="num muted">D{Math.max(0, Math.floor((e.h - s.threat.eventH) / 24) + 1)} {String(clockHour(s, e.h)).padStart(2, '0')}h</span> {logText(e)}
          </li>
        ))}
      </ul>
    </Sheet>
  );
}

export function ReportSheet({ s }: { s: GameState }) {
  const r = s.lastReport;
  if (!r) return null;
  const close = () => (showReport.value = false);
  return (
    <Sheet
      title={fmt(T.report.title, { n: s.day })}
      onClose={close}
      footer={
        <button class="btn primary wide" onClick={close}>
          {T.report.ok}
        </button>
      }
    >
      <dl class="report">
        <dt>{T.report.water}</dt>
        <dd class="num">{num(r.waterUsedL, 1)} L</dd>
        <dt>{T.report.food}</dt>
        <dd class="num">
          {num(r.kcalEaten)} / {num(r.kcalSpent)} kcal
        </dd>
        {s.threat.primary === 'nuclear' && (
          <>
            <dt>{T.report.dose}</dt>
            <dd class="num">{s.inv.dosimetro ? `${num(r.doseMSv, 2)} mSv` : '?'}</dd>
          </>
        )}
        {r.fuelUsedL > 0 && (
          <>
            <dt>{T.report.fuel}</dt>
            <dd class="num">{num(r.fuelUsedL, 1)} L</dd>
          </>
        )}
        {s.inv.medidor_co2 > 0 && (
          <>
            <dt>{T.report.co2}</dt>
            <dd class="num">{num(r.co2Max)} ppm</dd>
          </>
        )}
        <dt>{T.report.temp}</dt>
        <dd class="num">{num(r.tempMin, 1)} °C</dd>
      </dl>
      {r.notes.length > 0 && (
        <ul class="log">
          {r.notes.map((e, i) => (
            <li key={i} class={`tone-${e.tone}`}>
              {logText(e)}
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}

export function CrisisScreen({ s }: { s: GameState }) {
  const [showSurv, setShowSurv] = useState(false);
  const p = s.plan;
  const set = (plan: Partial<DayPlan>) => act({ t: 'plan', plan });
  const hasGen = has(s.bunker, 'generador');
  const hasFan = has(s.bunker, 'ventilacion');
  const proj = s.bunker.project;
  const threatName = s.threat.variant ? C.variants[s.threat.variant].name : C.threats[s.threat.primary].name;
  return (
    <div class="screen crisis">
      <TopBar
        left={
          <span>
            {T.time.phase} <b>{s.phase}</b> · {T.time.day} <b class="num">{s.phaseDay}</b>/{s.phaseLength}
          </span>
        }
        mid={<span class="num">{String(clockHour(s)).padStart(2, '0')}:00</span>}
        right={<span class="small muted">{threatName}</span>}
      />
      <AlertBar s={s} />
      <ResourceChips s={s} />
      <BunkerView s={s} buildMode={!proj} />
      <div class="panel">
        <button class="btn ghost wide surv-toggle" aria-expanded={showSurv} onClick={() => setShowSurv(!showSurv)}>
          {showSurv ? '▾' : '▸'} Estado · Salud {Math.round(s.survivor.health)} · Ánimo {Math.round(s.survivor.morale)} · Cansancio {Math.round(s.survivor.fatigue)}
        </button>
        {showSurv && <SurvivorPanel s={s} />}
        {proj && (
          <p class="small">
            🔨 {C.projects[proj.kind]} {proj.module ? moduleName(proj.module) : ''}: {Math.round(100 * (1 - proj.hoursLeft / proj.hoursTotal))} % · faltan {Math.ceil(proj.hoursLeft)} h
          </p>
        )}
        <h3>{T.plan.title}</h3>
        <div class="slots">
          {(['morning', 'afternoon', 'night'] as const).map((slot) => (
            <button key={slot} class="slot" onClick={() => (sheet.value = `act:${slot}`)}>
              <span class="small muted">{T.plan[slot]}</span>
              <b>{T.plan.acts[p[slot]]}</b>
              {p[slot] === 'expedicion' && slot !== 'night' && p.exp?.[slot] && <span class="small muted">{placeName(p.exp[slot]!.loc)}</span>}
            </button>
          ))}
        </div>
        <label class="field">
          <span>
            {T.plan.food} <span class="muted small">({T.plan.rationFood[p.food]})</span>
          </span>
          <Seg label={T.plan.food} value={p.food} onChange={(v) => set({ food: v })} options={(['completa', 'reducida', 'minima'] as const).map((v) => ({ v, label: T.plan.rations[v] }))} />
        </label>
        <label class="field">
          <span>
            {T.plan.water} <span class="muted small">({T.plan.rationWater[p.water]})</span>
          </span>
          <Seg label={T.plan.water} value={p.water} onChange={(v) => set({ water: v })} options={(['normal', 'reducida', 'minima'] as const).map((v) => ({ v, label: T.plan.rations[v] }))} />
        </label>
        <div class="toggles">
          <span class="tog">
            {T.plan.lights} <Toggle label={T.plan.lights} on={p.lights} onChange={(v) => set({ lights: v })} />
          </span>
          {hasFan && (
            <span class="tog">
              {T.plan.fan} <Toggle label={T.plan.fan} on={p.fan} onChange={(v) => set({ fan: v })} />
            </span>
          )}
        </div>
        {hasGen && (
          <label class="field">
            <span>{T.plan.generator}</span>
            <Seg label={T.plan.generator} value={p.generator} onChange={(v) => set({ generator: v })} options={(['off', 'auto', 'on'] as const).map((v) => ({ v, label: T.plan.gen[v] }))} />
          </label>
        )}
        <button class="btn ghost wide" onClick={() => (sheet.value = 'log')}>
          📓 {T.report.log}
        </button>
      </div>
      <div class="cta">
        <button class="btn primary wide big" onClick={() => act({ t: 'advanceDay' })}>
          {T.plan.advance} →
        </button>
      </div>
      {sheet.value?.startsWith('act:') && <ActPicker s={s} slot={sheet.value.slice(4) as 'morning'} />}
      {sheet.value?.startsWith('map:') && <MapSheet s={s} slot={sheet.value.slice(4) as 'morning'} />}
      {sheet.value === 'log' && <LogSheet s={s} />}
      {selectedCell.value && <CellSheet s={s} />}
      {showReport.value && <ReportSheet s={s} />}
    </div>
  );
}
