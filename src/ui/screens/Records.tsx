/** Récords, estadísticas y racha diaria. */
import { C, T, fmt, num } from '../../i18n';
import { records, screen } from '../store';

const threatName = (t: string) => C.variants[t]?.name ?? C.threats[t]?.name ?? t;

export function RecordsScreen() {
  const r = records.value;
  const causes = Object.entries(r.causes).sort((a, b) => b[1] - a[1]);
  const maxCause = Math.max(1, ...causes.map(([, n]) => n));
  return (
    <div class="screen records">
      <header class="topbar">
        <button class="icon-btn" aria-label={T.common.back} onClick={() => (screen.value = 'menu')}>
          ←
        </button>
        <div class="tb-left">
          <b>{T.records.title}</b>
        </div>
      </header>
      {r.runs === 0 ? (
        <p class="muted">{T.records.empty}</p>
      ) : (
        <>
          <div class="panel">
            <dl class="report">
              <dt>{T.records.runs}</dt>
              <dd class="num">{r.runs}</dd>
              <dt>{T.records.totalDays}</dt>
              <dd class="num">{num(r.totalDays)}</dd>
              <dt>{T.records.streak}</dt>
              <dd class="num">{r.daily.streak}</dd>
              <dt>{T.records.bestStreak}</dt>
              <dd class="num">{r.daily.bestStreak}</dd>
            </dl>
          </div>
          <div class="panel">
            <h3>{T.records.best}</h3>
            <ul class="inv">
              {Object.entries(r.best).map(([t, run]) => (
                <li key={t}>
                  <span>{threatName(t)}</span>
                  <b class="num">{fmt(T.records.days, { d: run.days, p: run.phase, s: run.score })}</b>
                </li>
              ))}
            </ul>
          </div>
          <div class="panel">
            <h3>{T.records.causes}</h3>
            <ul class="causes">
              {causes.map(([c, n]) => (
                <li key={c}>
                  <span>{C.causes[c] ?? c}</span>
                  <span class="cause-bar" style={{ width: `${(n / maxCause) * 100}%` }} />
                  <b class="num">{n}</b>
                </li>
              ))}
            </ul>
          </div>
          <div class="panel">
            <h3>{T.records.history}</h3>
            <ul class="inv">
              {r.history.slice(0, 10).map((run, i) => (
                <li key={i}>
                  <span>
                    {threatName(run.threat)} {run.mode === 'diaria' ? '📅' : ''}
                    <span class="small muted"> · {run.seed}</span>
                  </span>
                  <b class="num">{fmt(T.records.days, { d: run.days, p: run.phase, s: run.score })}</b>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
