/** Indicadores de recursos críticos y estado del superviviente. */
import { gridUp, mainsUp, outdoorTemp } from '../../core/env';
import { edibleKcal, totalKcal } from '../../core/food';
import { airQual, alerts, batteryFrac, doseQual, foodDays, hydrationPct, insideDoseRate, nutritionPct, waterDays } from '../../core/selectors';
import type { GameState } from '../../core/types';
import { C, T, fmt, num } from '../../i18n';
import { Bar, Chip } from './ui';

const daysTxt = (d: number) => (d === Infinity ? '∞' : d >= 99 ? '99+' : num(d, d < 10 ? 1 : 0));
const daysTone = (d: number): 'good' | 'warn' | 'bad' => (d < 2 ? 'bad' : d < 5 ? 'warn' : 'good');

export function ResourceChips({ s }: { s: GameState }) {
  const wd = waterDays(s);
  const fd = foodDays(s);
  const bf = batteryFrac(s);
  const hasCo2 = (s.inv.medidor_co2 ?? 0) > 0;
  const aq = airQual(s.bunker.co2ppm);
  const hasDos = (s.inv.dosimetro ?? 0) > 0;
  const dr = insideDoseRate(s);
  const after = s.h >= s.threat.eventH;
  const t = s.bunker.interiorTempC;
  return (
    <div class="chips">
      <Chip icon="💧" label={T.hud.water} value={`${num(s.inv.agua ?? 0)} L`} sub={mainsUp(s) && after ? T.hud.tapOn : fmt(T.hud.days, { n: daysTxt(wd) })} tone={daysTone(wd)} />
      <Chip
        icon="🥫"
        label={T.hud.food}
        value={`${num(Math.round(edibleKcal(s) / 1000))}k kcal`}
        sub={`${fmt(T.hud.days, { n: daysTxt(fd) })}${totalKcal(s) - edibleKcal(s) > 500 ? ` · +${num(Math.round((totalKcal(s) - edibleKcal(s)) / 1000))}k ${T.hud.uncooked}` : ''}`}
        tone={daysTone(fd)}
      />
      <Chip
        icon="🔋"
        label={T.hud.power}
        value={gridUp(s) ? T.hud.grid : bf === null ? '—' : `${Math.round(bf * 100)} %`}
        sub={gridUp(s) ? T.hud.gridOn : `${num(s.inv.diesel ?? 0)} L diésel`}
        tone={gridUp(s) ? 'good' : bf === null ? undefined : bf < 0.2 ? 'bad' : bf < 0.4 ? 'warn' : 'good'}
      />
      <Chip
        icon="🌬️"
        label={T.hud.air}
        value={hasCo2 ? `${num(Math.round(s.bunker.co2ppm / 100) * 100)}` : T.hud.airQual[aq]}
        sub={hasCo2 ? 'ppm CO₂' : T.hud.noMeter}
        tone={aq === 'bueno' ? 'good' : aq === 'cargado' ? 'warn' : 'bad'}
      />
      <Chip
        icon="🌡️"
        label={T.hud.temp}
        value={`${num(t, 0)} °C`}
        sub={after ? `fuera ${num(outdoorTemp(s), 0)} °C` : T.hud.temp}
        tone={t < 8 ? 'bad' : t < 14 ? 'warn' : 'good'}
      />
      {s.threat.primary === 'nuclear' && after && (
        <Chip
          icon="☢️"
          label={T.hud.dose}
          value={hasDos ? `${num(dr, dr < 1 ? 3 : 1)}` : T.hud.doseQual[doseQual(dr)]}
          sub={hasDos ? 'mSv/h dentro' : T.hud.doseUnknown}
          tone={doseQual(dr) === 'baja' ? 'good' : doseQual(dr) === 'media' ? 'warn' : 'bad'}
        />
      )}
    </div>
  );
}

export function AlertBar({ s }: { s: GameState }) {
  const a = alerts(s);
  if (!a.length) return null;
  return (
    <div class="alerts" role="status" aria-live="polite">
      {a.map((x) => (
        <span key={x.key} class={`alert tone-${x.level}`}>
          ⚠ {T.alerts[x.key]}
        </span>
      ))}
    </div>
  );
}

export function SurvivorPanel({ s }: { s: GameState }) {
  const sv = s.survivor;
  const hasDos = (s.inv.dosimetro ?? 0) > 0;
  return (
    <div class="surv-panel">
      <Bar label={T.surv.health} value={sv.health} />
      <Bar label={T.surv.hydration} value={hydrationPct(s)} />
      <Bar label={T.surv.nutrition} value={nutritionPct(s)} />
      <Bar label={T.surv.fatigue} value={100 - sv.fatigue} text={`${Math.round(sv.fatigue)}`} />
      <Bar label={T.surv.morale} value={sv.morale} />
      <Bar label={T.surv.hygiene} value={sv.hygiene} />
      <Bar label={T.surv.body} value={Math.max(0, sv.coreTempC - 28)} max={9} text={`${num(sv.coreTempC, 1)} °C`} />
      {s.threat.primary === 'nuclear' && (
        <Bar label={T.surv.dose} value={Math.max(0, 3500 - sv.doseMSv)} max={3500} text={hasDos ? `${num(sv.doseMSv, 0)} mSv` : '?'} />
      )}
      {sv.injuries > 1 && <Bar label={T.surv.injuries} value={100 - sv.injuries} text={`${Math.round(sv.injuries)}`} />}
      {/* La incubación no se ve: solo aparecen los síntomas. */}
      {sv.infection?.stage === 'activa' && (
        <p class="inf tone-bad">
          {T.surv.infection}: {C.infections[sv.infection.kind]} ({Math.round(sv.infection.severity)})
        </p>
      )}
    </div>
  );
}
