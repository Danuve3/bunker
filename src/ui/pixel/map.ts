/**
 * Mapa de expediciones en pixel art (vista cenital): terreno según la amenaza,
 * calles desde el búnker, río, árboles y edificios con su icono.
 */
import type { GameState, Location } from '../../core/types';
import { C, ctx2d, disc, hash, hline, makeCanvas, px, rect, vnoise, type Ctx } from './gfx';
import { ICONS } from './icons';
import { lookFor } from './scene';

export const MAP = 168;
const R = 70;
export const mapRad = (km: number) => Math.sqrt(km / 3) * R;
const rawPos = (l: Location) => ({ x: MAP / 2 + Math.cos(l.angle) * mapRad(l.distKm), y: MAP / 2 + Math.sin(l.angle) * mapRad(l.distKm) });
const layoutCache = new WeakMap<Location[], Map<string, { x: number; y: number }>>();

/** Posiciones en el mapa separadas al menos 24 px entre sí y del búnker (relajación simple). */
export function layout(locs: Location[]): Map<string, { x: number; y: number }> {
  const hit = layoutCache.get(locs);
  if (hit) return hit;
  const pts = locs.map((l) => ({ id: l.id, ...rawPos(l) }));
  const MIN = 24;
  for (let it = 0; it < 60; it++) {
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      // lejos del búnker
      const dc = Math.hypot(a.x - MAP / 2, a.y - MAP / 2);
      if (dc < MIN) {
        const k = (MIN - dc) / (dc || 1);
        a.x += (a.x - MAP / 2 || 1) * k * 0.5;
        a.y += (a.y - MAP / 2) * k * 0.5;
      }
      for (let j = i + 1; j < pts.length; j++) {
        const b = pts[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 0.01;
        if (d < MIN) {
          const push = (MIN - d) / 2;
          a.x -= (dx / d) * push;
          a.y -= (dy / d) * push;
          b.x += (dx / d) * push;
          b.y += (dy / d) * push;
        }
      }
      a.x = Math.max(12, Math.min(MAP - 12, a.x));
      a.y = Math.max(16, Math.min(MAP - 10, a.y));
    }
  }
  const m = new Map(pts.map((p) => [p.id, { x: p.x, y: p.y }]));
  layoutCache.set(locs, m);
  return m;
}
export const locPosIn = (locs: Location[], l: Location) => layout(locs).get(l.id) ?? rawPos(l);
export const locPos = rawPos;

function thickLine(c: Ctx, x0: number, y0: number, x1: number, y1: number, w: number, col: string) {
  const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    const y = y0 + ((y1 - y0) * i) / n;
    rect(c, Math.round(x - w / 2), Math.round(y - w / 2), w, w, col);
  }
}

const ROOF: Record<string, [string, string]> = {
  farmacia: [C.grn2, C.grn3],
  super: [C.red1, C.red2],
  gasolinera: [C.red1, C.hazard],
  ferreteria: [C.blu1, C.blu2],
  hospital: [C.bon0, C.bon2],
  casa: [C.red1, C.red2],
  rio: [C.blu1, C.blu2],
  huerto: [C.wod1, C.grn2],
  colegio: [C.amb1, C.amb2],
};

export class MapRenderer {
  private low = makeCanvas(MAP, MAP);
  private lc = ctx2d(this.low);
  private baseKey = '';
  private base = makeCanvas(MAP, MAP);

  private drawBase(s: GameState) {
    const c = ctx2d(this.base);
    const look = lookFor(s);
    const k = look.after ? look.key : 'normal';
    const pal =
      k === 'frio'
        ? ['#d9e3ea', '#e9f0f4', '#c4d2dc']
        : k === 'nuclear'
          ? ['#5e5548', '#6c6253', '#4f473c']
          : k === 'inundacion'
            ? ['#3f5a3a', '#4a6a42', '#2f4a36']
            : k === 'colapso'
              ? ['#4f5a36', '#5c683e', '#424c2e']
              : ['#4a7a30', '#5a8c3a', '#3d6a28'];
    for (let y = 0; y < MAP; y++)
      for (let x = 0; x < MAP; x++) {
        const n = vnoise(x, y, 6, look.seed) * 0.7 + hash(x, y, look.seed) * 0.3;
        px(c, x, y, pal[n < 0.35 ? 2 : n < 0.7 ? 0 : 1]);
      }
    // río (pasa cerca del lugar "rio" si existe)
    const rio = s.map.find((l) => l.type === 'rio');
    const ry = rio ? locPosIn(s.map, rio).y : MAP * 0.78;
    for (let x = 0; x < MAP; x++) {
      const y = Math.round(ry + Math.sin(x / 17 + look.seed) * 6 + 3);
      const water = k === 'frio' ? ['#b9d6e6', '#e3f1f8'] : [C.blu2, C.blu3];
      for (let j = -3; j <= 3; j++) px(c, x, y + j, Math.abs(j) === 3 ? '#6b5a3c' : j === -2 ? water[1] : water[0]);
      if (x % 7 === 0 && k !== 'frio') px(c, x, y, C.blu4);
    }
    if (k === 'inundacion') for (let i = 0; i < 18; i++) disc(c, Math.floor(hash(i, 1, look.seed) * MAP), Math.floor(hash(i, 2, look.seed) * MAP), 3 + Math.floor(hash(i, 3) * 5), C.blu2);
    // calles: anillo y radiales hacia cada lugar
    const cx = MAP / 2;
    const cy = MAP / 2;
    for (let a = 0; a < Math.PI * 2; a += 0.01) {
      const x = cx + Math.cos(a) * mapRad(1);
      const y = cy + Math.sin(a) * mapRad(1);
      rect(c, Math.round(x - 1), Math.round(y - 1), 3, 3, C.con2);
    }
    for (const l of s.map) {
      const p = locPosIn(s.map, l);
      thickLine(c, cx, cy, p.x, p.y, 4, C.con1);
      thickLine(c, cx, cy, p.x, p.y, 2, C.con2);
    }
    // líneas discontinuas
    for (const l of s.map) {
      const p = locPosIn(s.map, l);
      const n = Math.hypot(p.x - cx, p.y - cy);
      for (let i = 8; i < n - 6; i += 5) px(c, Math.round(cx + ((p.x - cx) * i) / n), Math.round(cy + ((p.y - cy) * i) / n), k === 'frio' ? C.bon1 : C.amb2);
    }
    // árboles
    for (let i = 0; i < 70; i++) {
      const x = Math.floor(hash(i, 5, look.seed) * MAP);
      const y = Math.floor(hash(i, 6, look.seed) * MAP);
      if (Math.hypot(x - cx, y - cy) < 14) continue;
      if (s.map.some((l) => Math.hypot(locPosIn(s.map, l).x - x, locPosIn(s.map, l).y - y) < 12)) continue;
      const dead = k === 'nuclear';
      disc(c, x, y + 1, 3, 'rgba(0,0,0,0.25)');
      disc(c, x, y, 3, dead ? '#4a3a2a' : k === 'frio' ? '#5c7a5a' : C.grn1);
      disc(c, x - 1, y - 1, 2, dead ? '#5a4632' : k === 'frio' ? C.bon2 : C.grn2);
      px(c, x - 1, y - 2, dead ? '#6a553e' : k === 'frio' ? '#ffffff' : C.grn3);
    }
    // búnker (centro)
    rect(c, cx - 9, cy - 8, 18, 16, C.ink);
    rect(c, cx - 8, cy - 7, 16, 14, C.red1);
    for (let y = cy - 7; y < cy + 7; y += 2) hline(c, cx - 8, y, 16, C.red2);
    hline(c, cx - 8, cy - 7, 16, C.red3);
    rect(c, cx - 2, cy + 3, 4, 4, C.wod1);
  }

  render(out: HTMLCanvasElement, s: GameState, sel: string | null, t: number) {
    const key = `${s.seed}|${s.threat.variant ?? s.threat.primary}|${s.h >= s.threat.eventH}`;
    if (key !== this.baseKey) {
      this.drawBase(s);
      this.baseKey = key;
    }
    const c = this.lc;
    c.drawImage(this.base, 0, 0);
    for (const l of s.map) {
      const p = locPosIn(s.map, l);
      const x = Math.round(p.x);
      const y = Math.round(p.y);
      const [roofLo, roof] = ROOF[l.type] ?? [C.con2, C.con3];
      // edificio con sombra
      rect(c, x - 9, y - 5, 19, 13, 'rgba(0,0,0,0.3)');
      rect(c, x - 10, y - 7, 20, 13, C.ink);
      rect(c, x - 9, y - 6, 18, 11, roofLo);
      rect(c, x - 9, y - 6, 18, 4, roof);
      hline(c, x - 9, y - 6, 18, C.bon2);
      if (l.looted > 0.85) for (let k = 0; k < 6; k++) px(c, x - 8 + Math.floor(hash(k, x) * 16), y - 5 + Math.floor(hash(k, y) * 9), C.ink);
      // icono encima
      c.save();
      c.translate(x - 8, y - 14);
      (ICONS[l.type] ?? ICONS.casa)(c);
      c.restore();
      if (l.id === sel) {
        const bob = Math.floor(t / 250) % 2;
        for (let k = 0; k < 5; k++) hline(c, x - 4 + k, y - 24 - k + bob, 9 - k * 2, C.amb3);
        for (let a = 0; a < 24; a++) {
          const ang = (a / 24) * Math.PI * 2 + t / 900;
          px(c, Math.round(x + Math.cos(ang) * 14), Math.round(y + Math.sin(ang) * 12), a % 2 ? C.amb3 : C.ink);
        }
      }
    }
    const oc = out.getContext('2d')!;
    oc.imageSmoothingEnabled = false;
    oc.drawImage(this.low, 0, 0, out.width, out.height);
  }
}
