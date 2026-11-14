import type { ComponentChildren } from 'preact';
import { toMenu } from '../store';

export function TopBar({ left, mid, right }: { left: ComponentChildren; mid?: ComponentChildren; right?: ComponentChildren }) {
  return (
    <header class="topbar">
      <button class="icon-btn" aria-label="Menú" onClick={toMenu}>
        ☰
      </button>
      <div class="tb-left">{left}</div>
      <div class="tb-mid">{mid}</div>
      <div class="tb-right">{right}</div>
    </header>
  );
}
