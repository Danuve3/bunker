/** Componentes de interfaz reutilizables. */
import type { ComponentChildren } from 'preact';
import { useEffect } from 'preact/hooks';

export function Sheet({ title, onClose, children, footer }: { title: string; onClose: () => void; children: ComponentChildren; footer?: ComponentChildren }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    addEventListener('keydown', k);
    return () => removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div class="sheet-wrap" onClick={onClose}>
      <div class="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <header class="sheet-head">
          <h2>{title}</h2>
          <button class="icon-btn" aria-label="Cerrar" onClick={onClose}>
            ✕
          </button>
        </header>
        <div class="sheet-body">{children}</div>
        {footer && <footer class="sheet-foot">{footer}</footer>}
      </div>
    </div>
  );
}

export function Bar({ label, value, max = 100, tone, text }: { label: string; value: number; max?: number; tone?: 'good' | 'warn' | 'bad' | 'info'; text?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const t = tone ?? (pct > 60 ? 'good' : pct > 30 ? 'warn' : 'bad');
  return (
    <div class="bar" role="meter" aria-label={label} aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={max}>
      <div class="bar-top">
        <span>{label}</span>
        <span class="num">{text ?? Math.round(pct)}</span>
      </div>
      <div class="bar-track">
        <div class={`bar-fill tone-${t}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function Chip({ icon, label, value, sub, tone }: { icon: string; label: string; value: string; sub?: string; tone?: 'good' | 'warn' | 'bad' }) {
  return (
    <div class={`chip ${tone ? `tone-${tone}` : ''}`} aria-label={`${label}: ${value} ${sub ?? ''}`}>
      <span class="chip-icon" aria-hidden="true">
        {icon}
      </span>
      <span class="chip-text">
        <span class="chip-val num">{value}</span>
        <span class="chip-sub">{sub ?? label}</span>
      </span>
    </div>
  );
}

export function Seg<T extends string>({ value, options, onChange, label }: { value: T; options: { v: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div class="seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.v} role="radio" aria-checked={o.v === value} class={o.v === value ? 'on' : ''} onClick={() => onChange(o.v)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Stepper({ value, onChange, max, label }: { value: number; onChange: (v: number) => void; max: number; label: string }) {
  return (
    <div class="stepper" aria-label={label}>
      <button aria-label={`Quitar ${label}`} disabled={value <= 0} onClick={() => onChange(Math.max(0, value - 1))}>
        −
      </button>
      <span class="num">{value}</span>
      <button aria-label={`Añadir ${label}`} disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))}>
        +
      </button>
    </div>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button class={`toggle ${on ? 'on' : ''}`} role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}>
      <span class="knob" />
    </button>
  );
}
