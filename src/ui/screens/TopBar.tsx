import type { ComponentChildren } from 'preact';
import { toMenu } from '../store';
import { settings, updateSettings } from '../settings';

export function TopBar({ left, mid, right }: { left: ComponentChildren; mid?: ComponentChildren; right?: ComponentChildren }) {
  const muted = settings.value.muted;
  return (
    <header class="topbar">
      <button class="icon-btn" aria-label="Menú" onClick={toMenu}>
        ☰
      </button>
      <div class="tb-left">{left}</div>
      <div class="tb-mid">{mid}</div>
      <div class="tb-right">{right}</div>
      <button class="icon-btn mute" aria-label={muted ? 'Activar sonido' : 'Silenciar'} aria-pressed={muted} onClick={() => updateSettings({ muted: !muted })}>
        {muted ? '🔇' : '🔊'}
      </button>
    </header>
  );
}
