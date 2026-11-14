import type { ComponentChildren } from 'preact';
import { toMenu } from '../store';
import { settings, updateSettings } from '../settings';
import { PixelIcon } from '../components/PixelIcon';

export function TopBar({ left, mid, right }: { left: ComponentChildren; mid?: ComponentChildren; right?: ComponentChildren }) {
  const muted = settings.value.muted;
  return (
    <header class="topbar">
      <button class="icon-btn" aria-label="Menú" onClick={toMenu}>
        <PixelIcon name="menu" size={24} />
      </button>
      <div class="tb-left">{left}</div>
      <div class="tb-mid">{mid}</div>
      <div class="tb-right">{right}</div>
      <button class="icon-btn mute" aria-label={muted ? 'Activar sonido' : 'Silenciar'} aria-pressed={muted} onClick={() => updateSettings({ muted: !muted })}>
        <PixelIcon name={muted ? 'silencio' : 'sonido'} size={24} />
      </button>
    </header>
  );
}
