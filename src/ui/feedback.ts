/** Sonido, vibración y ambiente según lo que pasa en la partida. */
import { effect } from '@preact/signals';
import { audio, type AmbientState } from '../audio/engine';
import { alerts, insideDoseRate } from '../core/selectors';
import { perkMods } from '../core/perks';
import type { Action } from '../core/game';
import type { GameState } from '../core/types';
import { HAPTIC, vibrate } from '../platform/haptics';
import { game, screen } from './store';

export function ambientFor(s: GameState | null, onMenu: boolean): AmbientState {
  if (!s || onMenu) return { wind: 0.25, rain: 0, generator: false, geigerCps: 0, heartbeat: false };
  const after = s.h >= s.threat.eventH;
  const key = s.threat.variant ?? s.threat.primary;
  const wind = !after ? 0.2 : ({ nuclear: 0.45, frio: 0.85, inundacion: 0.6, tormenta_solar: 0.35, colapso: 0.3, pandemia: 0.2 } as Record<string, number>)[key] ?? 0.3;
  const rain = after && key === 'inundacion' ? 0.8 : 0;
  const hasCounter = (s.inv.dosimetro ?? 0) > 0 || perkMods(s).seeDose;
  // Un tubo Geiger típico da ~100-150 cpm por µSv/h; aquí, escala logarítmica audible.
  const uSvh = insideDoseRate(s) * 1000;
  const geigerCps = after && s.threat.fallout.length && hasCounter ? Math.min(35, 0.3 + 6 * Math.log10(1 + uSvh)) : 0;
  return {
    wind,
    rain,
    generator: after && s.bunker.genRunning,
    geigerCps,
    heartbeat: s.stage !== 'dead' && s.survivor.health < 25,
  };
}

/** Efectos de un cambio de estado (llamado por act). */
export function feedback(s0: GameState, s: GameState, a: Action) {
  if (s.stage === 'dead' && s0.stage !== 'dead') {
    audio.play('death');
    vibrate(HAPTIC.death);
    return;
  }
  if (s.pending && s.pending !== s0.pending) {
    if (s.pending.kind === 'boss') {
      audio.play('boss');
      vibrate(HAPTIC.boss);
    } else {
      audio.play('event');
      vibrate(HAPTIC.event);
    }
  } else if (s.stage === 'phaseEnd' && s0.stage !== 'phaseEnd') {
    audio.play('win');
    vibrate(HAPTIC.win);
  } else if (a.t === 'advanceDay') audio.play('day');
  else if (a.t === 'buy' && s.money < s0.money) audio.play('buy');
  else if (a.t === 'project' && s.bunker.project && !s0.bunker.project) audio.play('dig');
  else if (a.t === 'pickPerk') audio.play('perk');
  // Alarma si aparece una alerta grave nueva
  const before = new Set(alerts(s0).filter((x) => x.level === 'bad').map((x) => x.key));
  if (alerts(s).some((x) => x.level === 'bad' && !before.has(x.key)) && s.stage !== 'dead') {
    setTimeout(() => audio.play('alarm'), 400);
    vibrate(HAPTIC.alarm);
  }
}

/** Desbloquea el audio con el primer gesto y suena un "tic" en los botones. */
export function initAudioUi() {
  const unlock = () => audio.unlock();
  addEventListener('pointerdown', unlock, { passive: true });
  addEventListener('keydown', unlock);
  addEventListener(
    'click',
    (e) => {
      const el = (e.target as HTMLElement | null)?.closest?.('button');
      if (el && !(el as HTMLButtonElement).disabled) audio.play('tap');
    },
    { capture: true, passive: true },
  );
  effect(() => audio.setAmbient(ambientFor(game.value, screen.value !== 'game')));
}
