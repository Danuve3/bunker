/** Tutorial guiado: burbujas paso a paso que avanzan al cumplir cada objetivo. */
import { useEffect, useRef } from 'preact/hooks';
import { totalKcal } from '../../core/food';
import type { GameState } from '../../core/types';
import { T } from '../../i18n';
import { act } from '../store';
import { updateSettings } from '../settings';

interface Step {
  /** Objetivo cumplido → pasa al siguiente paso automáticamente. */
  done?: (s: GameState) => boolean;
  /** Paso informativo con botón "Siguiente". */
  info?: boolean;
  /** Solo se muestra en estas etapas. */
  stages?: GameState['stage'][];
}

const STEPS: Step[] = [
  { stages: ['briefing'], done: (s) => s.stage !== 'briefing' },
  { stages: ['prep'], info: true },
  { stages: ['prep'], done: (s) => (s.inv.agua ?? 0) >= 40 && totalKcal(s) >= 15000 },
  { stages: ['prep'], done: (s) => (s.inv.sacos ?? 0) >= 36 || (s.bunker.coverCm[s.bunker.entryCol] ?? 0) > 0 },
  { stages: ['prep'], done: (s) => (s.bunker.coverCm[s.bunker.entryCol] ?? 0) > 0 },
  { stages: ['prep'], done: (s) => !!s.inv.banera },
  { stages: ['prep', 'crisis'], done: (s) => s.stage !== 'prep' },
  { stages: ['crisis'], info: true },
  { stages: ['crisis'], info: true },
  { stages: ['crisis', 'event', 'boss'], done: (s) => s.day >= 1 },
  { stages: ['crisis', 'event'], info: true },
  { stages: ['crisis', 'event', 'boss'], done: (s) => s.stage === 'phaseEnd' || s.stats.bossesBeaten > 0 },
  { stages: ['phaseEnd', 'crisis', 'event', 'boss'], info: true },
];

export function TutorialCoach({ s }: { s: GameState }) {
  const t = s.tutorial;
  const step = t ? STEPS[t.step] : undefined;
  useEffect(() => {
    if (!t || t.done || !step?.done) return;
    if (step.done(s)) act({ t: 'tutorial', step: t.step + 1 });
  }, [s, t, step]);
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const h = ref.current?.offsetHeight;
    if (h) document.documentElement.style.setProperty('--coach-h', `${h}px`);
  });
  const visible = !!t && !t.done && !!step && s.stage !== 'dead' && (!step.stages || step.stages.includes(s.stage));
  useEffect(() => {
    document.body.classList.toggle('with-coach', visible);
    return () => document.body.classList.remove('with-coach');
  }, [visible]);
  if (!visible || !t || !step) return null;
  const last = t.step === STEPS.length - 1;
  const finish = () => {
    act({ t: 'tutorial', step: t.step, done: true });
    updateSettings({ tutorialDone: true });
  };
  return (
    <aside ref={ref} class="coach" role="dialog" aria-live="polite" aria-label={T.tutorial.title}>
      <p class="coach-kind">
        {T.tutorial.title} · {t.step + 1}/{STEPS.length}
      </p>
      <p class="coach-text">{T.tutorial.steps[t.step]}</p>
      <div class="row">
        <button class="btn ghost" onClick={finish}>
          {last ? T.tutorial.close : T.tutorial.skip}
        </button>
        {step.info && !last && (
          <button class="btn primary" onClick={() => act({ t: 'tutorial', step: t.step + 1 })}>
            {T.tutorial.next}
          </button>
        )}
      </div>
    </aside>
  );
}
