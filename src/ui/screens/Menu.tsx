/** Menú principal, anuncio de amenaza y ayuda. */
import { useState } from 'preact/hooks';
import { clockHour } from '../../core/env';
import { dailySeed } from '../../core/rng';
import type { GameState } from '../../core/types';
import { C, T, num } from '../../i18n';
import { Sheet } from '../components/ui';
import { act, records, randomSeed, resume, savedRun, screen, start, startDaily, startTutorial } from '../store';
import { settings } from '../settings';
import { canInstall, isIOS, isStandalone, promptInstall } from '../../pwa/register';

export function Menu() {
  const [confirm, setConfirm] = useState<null | (() => void)>(null);
  const [seedOpen, setSeedOpen] = useState(false);
  const [iosOpen, setIosOpen] = useState(false);
  const [seed, setSeed] = useState('');
  const guard = (fn: () => void) => () => (savedRun.value ? setConfirm(() => fn) : fn());
  const today = dailySeed(new Date());
  return (
    <div class="screen menu">
      <div class="menu-art" aria-hidden="true">
        <svg viewBox="0 0 200 120">
          <rect width="200" height="56" fill="#3b3530" />
          <circle cx="160" cy="22" r="9" fill="#e9d8a6" opacity="0.7" />
          <rect y="56" width="200" height="64" fill="#5a4030" />
          <rect y="54" width="200" height="4" fill="#6b7a43" />
          <path d="M70 56 V30 L100 12 L130 30 V56 Z" fill="#2a2420" stroke="#1a1612" />
          <rect x="88" y="70" width="40" height="26" fill="#221d18" stroke="#8a8075" stroke-width="2" />
          <rect x="88" y="70" width="40" height="26" fill="#f2a93b" opacity="0.18" />
          <line x1="94" y1="56" x2="94" y2="70" stroke="#8a7a66" stroke-width="2" />
          <circle cx="112" cy="80" r="3" fill="#e0b48a" />
          <rect x="109" y="83" width="6" height="9" fill="#b5483b" />
        </svg>
      </div>
      <h1 class="logo">{T.app.title}</h1>
      <p class="tagline">{T.app.tagline}</p>
      <div class="menu-btns">
        {savedRun.value && (
          <button class="btn primary wide big" onClick={resume}>
            {T.menu.continue}
            <span class="small">
              {savedRun.value.phase > 0 ? `Fase ${savedRun.value.phase} · día ${savedRun.value.day}` : T.time.prep} · {savedRun.value.seed}
            </span>
          </button>
        )}
        {!settings.value.tutorialDone && records.value.runs === 0 && !savedRun.value && (
          <button class="btn primary wide big" onClick={startTutorial}>
            {T.tutorial.firstTime}
          </button>
        )}
        <button class={`btn wide big ${savedRun.value || (!settings.value.tutorialDone && records.value.runs === 0) ? '' : 'primary'}`} onClick={guard(() => start(randomSeed(), 'normal'))}>
          {T.menu.newGame}
        </button>
        <button class="btn wide" onClick={guard(startDaily)}>
          {T.menu.daily}
          <span class="small muted">{today}</span>
        </button>
        <button class="btn ghost wide" onClick={() => setSeedOpen(true)}>
          {T.menu.customSeed}
        </button>
        {canInstall.value && (
          <button class="btn ghost wide" onClick={() => void promptInstall()}>
            ⬇ {T.pwa.install}
          </button>
        )}
        {isIOS && !isStandalone() && (
          <button class="btn ghost wide" onClick={() => setIosOpen(true)}>
            ⬇ {T.pwa.installIOS}
          </button>
        )}
        <div class="row">
          <button class="btn ghost" onClick={guard(startTutorial)}>
            {T.tutorial.menu}
          </button>
          <button class="btn ghost" onClick={() => (screen.value = 'records')}>
            {T.menu.records}
          </button>
          <button class="btn ghost" onClick={() => (screen.value = 'howto')}>
            {T.menu.howTo}
          </button>
          <button class="btn ghost" onClick={() => (screen.value = 'settings')}>
            {T.menu.settings}
          </button>
        </div>
      </div>
      {iosOpen && (
        <Sheet title={T.pwa.iosTitle} onClose={() => setIosOpen(false)}>
          <ol class="steps">
            {T.pwa.iosSteps.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ol>
        </Sheet>
      )}
      {confirm && (
        <Sheet
          title={T.menu.newGame}
          onClose={() => setConfirm(null)}
          footer={
            <div class="row">
              <button class="btn ghost" onClick={() => setConfirm(null)}>
                {T.common.cancel}
              </button>
              <button
                class="btn danger"
                onClick={() => {
                  const fn = confirm;
                  setConfirm(null);
                  fn();
                }}
              >
                {T.common.yes}
              </button>
            </div>
          }
        >
          <p>{T.menu.confirmNew}</p>
        </Sheet>
      )}
      {seedOpen && (
        <Sheet
          title={T.menu.customSeed}
          onClose={() => setSeedOpen(false)}
          footer={
            <button
              class="btn primary wide"
              disabled={!seed.trim()}
              onClick={() => {
                setSeedOpen(false);
                guard(() => start(seed.trim().toUpperCase().slice(0, 32), 'normal'))();
              }}
            >
              {T.menu.newGame}
            </button>
          }
        >
          <label class="field">
            <span>{T.menu.seedPrompt}</span>
            <input class="input" value={seed} maxLength={32} autocapitalize="characters" onInput={(e) => setSeed((e.target as HTMLInputElement).value)} />
          </label>
        </Sheet>
      )}
    </div>
  );
}

export function Briefing({ s }: { s: GameState }) {
  const t = s.threat;
  const th = C.threats[t.primary];
  const v = t.variant ? C.variants[t.variant] : null;
  const hours = t.eventH - s.h;
  return (
    <div class="screen briefing">
      <p class="alert-banner">⚠ {T.briefing.alert} ⚠</p>
      <h1>{v ? `${th.name}: ${v.name}` : th.name}</h1>
      <p class="brief">{v ? v.brief : th.brief}</p>
      <dl class="report">
        <dt>{T.briefing.time}</dt>
        <dd class="num big">{hours} h</dd>
        <dt>{T.briefing.budget}</dt>
        <dd class="num big">{num(s.budget)} €</dd>
        <dt>Hora actual</dt>
        <dd class="num">{String(clockHour(s)).padStart(2, '0')}:00</dd>
        <dt>{T.briefing.seed}</dt>
        <dd class="num">{s.seed}</dd>
      </dl>
      <p class="tip">💡 {v ? v.tip : th.tip}</p>
      <div class="cta">
        <button class="btn primary wide big" onClick={() => act({ t: 'begin' })}>
          {T.briefing.begin}
        </button>
      </div>
    </div>
  );
}

export function HowTo() {
  return (
    <div class="screen howto">
      <header class="topbar">
        <button class="icon-btn" aria-label={T.common.back} onClick={() => (screen.value = 'menu')}>
          ←
        </button>
        <div class="tb-left">
          <b>{T.menu.howTo}</b>
        </div>
      </header>
      <div class="panel prose">
        <h3>Fase 0: preparación</h3>
        <p>
          Se anuncia una amenaza y empieza la cuenta atrás. Compra suministros, excava y construye módulos en el búnker. Cada viaje y cada obra cuestan horas y dinero, y las tiendas se vacían a medida que se acerca el evento.
        </p>
        <h3>Fases de crisis</h3>
        <p>
          Cada día eliges qué haces por la mañana, por la tarde y por la noche, y fijas las raciones de comida y agua. Al final de cada fase llega una crisis final. Si sobrevives, empieza otra fase más larga.
        </p>
        <h3>Sobrevivir</h3>
        <p>
          Vigila el agua (≈3,8 L/día), la comida (≈2.300 kcal/día), el aire (el CO₂ se acumula si no ventilas), el frío y la radiación. Cuanto más hondo, más protegido estás: cada 9 cm de tierra reducen a la mitad la radiación de la lluvia radiactiva.
        </p>
        <h3>Datos reales</h3>
        <p>Los números del juego salen de FEMA, CDC, OMS, NIOSH, NASA y Kearny, entre otras fuentes. Muchos sucesos incluyen una ficha «Dato real» con su fuente.</p>
        <p class="small muted">El juego se guarda solo después de cada acción. Puedes cerrarlo cuando quieras.</p>
      </div>
    </div>
  );
}
