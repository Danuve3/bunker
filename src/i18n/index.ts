/**
 * Acceso a textos. Hoy solo hay español; para traducir, añadir otro par ui/content
 * y elegirlo aquí según la preferencia del usuario.
 */
import { content } from './es-content';
import { ui } from './es';
import type { LogEntry } from '../core/types';

export const T = ui;
export const C = content;

/** Sustituye {param} en una plantilla. */
export function fmt(tpl: string, p?: Record<string, string | number>): string {
  if (!p) return tpl;
  return tpl.replace(/\{(\w+)\}/g, (_, k) => (p[k] !== undefined ? String(p[k]) : `{${k}}`));
}

function get(obj: unknown, path: string[]): unknown {
  let o: unknown = obj;
  for (const k of path) {
    if (o && typeof o === 'object' && k in (o as Record<string, unknown>)) o = (o as Record<string, unknown>)[k];
    else return undefined;
  }
  return o;
}

export const itemName = (id: string) => C.inv[id] ?? C.items[id]?.name ?? id;
export const moduleName = (id: string) => C.modules[id]?.name ?? id;

/** Traduce los parámetros que son ids (módulo, artículo, causa…). */
function localizeParams(p?: Record<string, string | number>): Record<string, string | number> | undefined {
  if (!p) return p;
  const out: Record<string, string | number> = { ...p };
  if (typeof p.module === 'string') out.module = p.module ? moduleName(p.module) : '';
  if (typeof p.item === 'string') out.item = itemName(p.item);
  if (typeof p.cause === 'string') out.cause = C.causes[p.cause] ?? p.cause;
  if (typeof p.kind === 'string') out.kind = C.infections[p.kind] ?? C.projects[p.kind] ?? p.kind;
  if (typeof p.shop === 'string') out.shop = C.shops[p.shop]?.name ?? p.shop;
  if (typeof p.method === 'string') out.method = C.methods[p.method] ?? p.method;
  return out;
}

/** Texto de una entrada del diario. */
export function logText(e: Pick<LogEntry, 'key' | 'p'>): string {
  const parts = e.key.split('.');
  if (parts[0] === 'card') {
    const card = C.cards[parts[1]];
    if (!card) return e.key;
    if (parts.length >= 4) return card.choices?.[parts[2]]?.res ?? '';
    return card.text;
  }
  if (parts[0] === 'log') {
    const v = get(C.log, parts.slice(1));
    if (typeof v === 'string') return fmt(v, localizeParams(e.p));
  }
  return e.key;
}

/** Números con formato español. */
export const num = (n: number, d = 0) => n.toLocaleString('es-ES', { maximumFractionDigits: d, minimumFractionDigits: d });
