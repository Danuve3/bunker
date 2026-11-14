/**
 * Iconos pixel art 16×16 dibujados por código (sin emojis ni archivos).
 * Se generan una vez como data URL y se escalan sin suavizado.
 */
import { C, box, disc, hline, px, rect, vline, type Ctx } from './gfx';

const S = 16;
type Draw = (c: Ctx) => void;

/** Rellena los píxeles que cumplen `inside`, con contorno y luz/sombra automáticas. */
function shape(c: Ctx, inside: (x: number, y: number) => boolean, fill: string, hi: string, lo: string) {
  const ins = (x: number, y: number) => x >= 0 && y >= 0 && x < S && y < S && inside(x + 0.5, y + 0.5);
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      if (ins(x, y)) {
        const edgeTL = !ins(x - 1, y) || !ins(x, y - 1);
        const edgeBR = !ins(x + 1, y) || !ins(x, y + 1);
        px(c, x, y, edgeTL ? hi : edgeBR ? lo : fill);
      } else if (ins(x - 1, y) || ins(x + 1, y) || ins(x, y - 1) || ins(x, y + 1)) px(c, x, y, C.ink);
    }
}

export const ICONS: Record<string, Draw> = {
  agua(c) {
    shape(c, (x, y) => (y > 7 ? (x - 8) ** 2 + (y - 9.5) ** 2 < 22 : Math.abs(x - 8) < (y - 1.5) * 0.65), C.blu3, C.blu4, C.blu1);
    px(c, 6, 9, C.bon2);
    px(c, 6, 10, C.blu4);
  },
  comida(c) {
    box(c, 4, 3, 8, 11, C.amb2, C.amb3, C.amb1);
    rect(c, 4, 3, 8, 2, C.met3);
    hline(c, 4, 3, 8, C.met4);
    rect(c, 4, 12, 8, 2, C.met3);
    rect(c, 5, 7, 6, 3, C.bon2);
    rect(c, 7, 7, 2, 3, C.red2);
  },
  bateria(c) {
    box(c, 4, 3, 8, 12, C.con1, C.con3, C.con0);
    rect(c, 6, 1, 4, 2, C.con3);
    px(c, 6, 1, C.ink);
    for (let k = 0; k < 3; k++) rect(c, 5, 10 - k * 3, 6, 2, k < 2 ? C.grn3 : C.grn4);
  },
  aire(c) {
    const lines: [number, number, number][] = [
      [2, 4, 9],
      [1, 8, 12],
      [3, 12, 8],
    ];
    for (const [x, y, w] of lines) {
      hline(c, x, y, w, C.blu4);
      hline(c, x, y + 1, w, C.blu2);
      px(c, x + w, y - 1, C.blu4);
      px(c, x + w + 1, y - 2, C.blu4);
      px(c, x + w, y - 2, C.blu3);
    }
  },
  temp(c) {
    rect(c, 6, 1, 4, 10, C.ink);
    rect(c, 7, 2, 2, 9, C.bon2);
    rect(c, 7, 6, 2, 5, C.red2);
    disc(c, 8, 12, 3, C.ink);
    disc(c, 8, 12, 2, C.red2);
    px(c, 7, 11, C.red3);
    for (const y of [3, 5, 7]) px(c, 10, y, C.bon0);
  },
  rad(c) {
    for (let y = 0; y < S; y++)
      for (let x = 0; x < S; x++) {
        const dx = x + 0.5 - 8;
        const dy = y + 0.5 - 8;
        const r = Math.hypot(dx, dy);
        if (r > 7.6) continue;
        if (r > 6.8) {
          px(c, x, y, C.ink);
          continue;
        }
        const a = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
        const blade = [90, 210, 330].some((b) => Math.abs(((a - b + 540) % 360) - 180) < 30);
        const on = r < 1.6 || (r > 2.6 && r < 6.2 && blade);
        px(c, x, y, on ? C.ink : r > 6 ? C.amb2 : C.hazard);
      }
  },
  diesel(c) {
    box(c, 3, 4, 10, 11, C.red2, C.red3, C.red1);
    rect(c, 9, 1, 3, 3, C.red1);
    rect(c, 4, 2, 4, 2, C.ink);
    hline(c, 5, 6, 6, C.red1);
    px(c, 5, 7, C.red3);
    px(c, 10, 12, C.red1);
    for (let k = 0; k < 5; k++) px(c, 5 + k, 7 + k, C.red1);
  },
  salud(c) {
    shape(c, (x, y) => {
      const a = (x - 5) ** 2 + (y - 6) ** 2 < 10;
      const b = (x - 11) ** 2 + (y - 6) ** 2 < 10;
      const t = y > 6 && Math.abs(x - 8) < (14 - y) * 0.95;
      return a || b || t;
    }, C.red2, C.red3, C.red1);
    px(c, 4, 5, C.bon2);
  },
  animo(c) {
    shape(c, (x, y) => (x - 8) ** 2 + (y - 8) ** 2 < 42, C.yel, '#fff0a0', C.amb1);
    rect(c, 5, 6, 2, 2, C.ink);
    rect(c, 9, 6, 2, 2, C.ink);
    hline(c, 6, 11, 4, C.ink);
    px(c, 5, 10, C.ink);
    px(c, 10, 10, C.ink);
  },
  cansancio(c) {
    shape(c, (x, y) => (x - 7) ** 2 + (y - 8) ** 2 < 30 && (x - 10) ** 2 + (y - 6) ** 2 > 20, C.bon1, C.bon2, C.bon0);
    hline(c, 11, 2, 3, C.blu4);
    px(c, 12, 3, C.blu4);
    hline(c, 11, 4, 3, C.blu4);
  },
  higiene(c) {
    box(c, 2, 8, 10, 6, C.pnk, '#f2b0dc', '#a9558f');
    disc(c, 11, 5, 2, C.blu4);
    disc(c, 6, 4, 1, C.blu4);
    px(c, 13, 9, C.blu4);
  },
  diario(c) {
    box(c, 3, 2, 10, 12, C.wod2, C.wod3, C.wod1);
    rect(c, 4, 3, 2, 10, C.wod1);
    for (const y of [5, 7, 9]) hline(c, 7, y, 5, C.bon1);
    rect(c, 11, 11, 1, 4, C.red2);
  },
  sonido(c) {
    rect(c, 2, 6, 3, 4, C.bon1);
    for (let k = 0; k < 4; k++) vline(c, 5 + k, 5 - k, 6 + k * 2, C.bon1);
    px(c, 1, 6, C.ink);
    for (const [x, h] of [
      [11, 4],
      [13, 8],
    ] as const)
      vline(c, x, 8 - h / 2, h, C.amb3);
  },
  silencio(c) {
    rect(c, 2, 6, 3, 4, C.con4);
    for (let k = 0; k < 4; k++) vline(c, 5 + k, 5 - k, 6 + k * 2, C.con4);
    for (let k = 0; k < 5; k++) {
      px(c, 10 + k, 6 + k, C.red3);
      px(c, 14 - k, 6 + k, C.red3);
    }
  },
  menu(c) {
    for (const y of [3, 7, 11]) {
      rect(c, 2, y, 12, 2, C.bon1);
      hline(c, 2, y + 2, 12, C.ink);
    }
  },
  alerta(c) {
    shape(c, (x, y) => y > 1.5 && y < 14.5 && Math.abs(x - 8) < (y - 1) * 0.55, C.hazard, '#fff0a0', C.amb1);
    rect(c, 7, 5, 2, 5, C.ink);
    rect(c, 7, 11, 2, 2, C.ink);
  },
  estrella(c) {
    const pts: [number, number][] = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const r = i % 2 ? 3 : 7.2;
      pts.push([8 + Math.cos(a) * r, 8.6 + Math.sin(a) * r]);
    }
    const inPoly = (x: number, y: number) => {
      let inside = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i];
        const [xj, yj] = pts[j];
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
      }
      return inside;
    };
    shape(c, inPoly, C.amb3, C.amb4, C.amb1);
  },
  // ── tiendas ──
  super(c) {
    hline(c, 1, 3, 3, C.met4);
    for (let k = 0; k < 6; k++) px(c, 3 + Math.floor(k / 3), 3 + k, C.met4);
    box(c, 5, 4, 10, 6, C.met2, C.met3, C.met1);
    for (let k = 0; k < 4; k++) vline(c, 7 + k * 2, 5, 4, C.met1);
    hline(c, 5, 11, 10, C.met4);
    disc(c, 7, 13, 1, C.ink);
    disc(c, 13, 13, 1, C.ink);
    rect(c, 6, 2, 3, 2, C.red2);
    rect(c, 10, 1, 3, 3, C.grn3);
  },
  ferreteria(c) {
    for (let k = 0; k < 10; k++) {
      px(c, 3 + k, 12 - k, C.met3);
      px(c, 4 + k, 12 - k, C.met2);
    }
    disc(c, 12, 3, 2, C.met3);
    px(c, 13, 2, C.ink);
    px(c, 12, 3, C.ink);
    rect(c, 2, 11, 4, 3, C.met3);
    rect(c, 6, 3, 2, 10, C.wod2);
    rect(c, 3, 2, 7, 3, C.con3);
    hline(c, 3, 2, 7, C.con4);
  },
  farmacia(c) {
    box(c, 2, 2, 12, 12, C.grn3, C.grn4, C.grn2);
    rect(c, 7, 4, 2, 8, C.bon2);
    rect(c, 4, 7, 8, 2, C.bon2);
  },
  gasolinera(c) {
    box(c, 3, 3, 7, 11, C.red2, C.red3, C.red1);
    rect(c, 4, 4, 5, 3, C.bon2);
    rect(c, 2, 14, 9, 1, C.con2);
    vline(c, 11, 5, 6, C.ink);
    hline(c, 11, 5, 2, C.ink);
    vline(c, 13, 5, 7, C.ink);
    px(c, 12, 11, C.ink);
  },
  outdoor(c) {
    shape(c, (x, y) => y > 3 && y < 14 && Math.abs(x - 8) < (y - 3) * 0.75, C.olv2, '#8da04c', C.olv0);
    for (let y = 8; y < 14; y++) px(c, 8, y, C.ink);
    for (let y = 9; y < 14; y++) for (let x = 8 - (y - 8) * 0.5; x <= 8; x++) px(c, Math.round(x), y, C.ink2);
    vline(c, 8, 1, 3, C.wod1);
  },
  online(c) {
    box(c, 2, 5, 12, 9, C.wod3, '#c49a6c', C.wod2);
    hline(c, 2, 8, 12, C.wod2);
    rect(c, 7, 5, 2, 9, C.bon1);
    rect(c, 4, 2, 8, 3, C.wod3);
    hline(c, 4, 2, 8, C.ink);
  },
  alquiler(c) {
    box(c, 2, 9, 9, 3, C.hazard, '#fff0a0', C.amb1);
    box(c, 5, 5, 5, 4, C.hazard, '#fff0a0', C.amb1);
    rect(c, 6, 6, 3, 2, C.blu3);
    rect(c, 2, 12, 9, 2, C.ink);
    for (let x = 3; x < 11; x += 2) px(c, x, 13, C.con3);
    for (let k = 0; k < 4; k++) px(c, 10 + k, 8 - k, C.amb1);
    rect(c, 13, 4, 2, 5, C.met2);
    rect(c, 12, 9, 3, 2, C.met3);
  },
  // ── lugares del mapa ──
  hospital(c) {
    box(c, 2, 4, 12, 10, C.bon2, C.bon2, C.bon0);
    rect(c, 7, 6, 2, 6, C.red2);
    rect(c, 5, 8, 6, 2, C.red2);
    rect(c, 5, 1, 6, 3, C.bon1);
  },
  casa(c) {
    shape(c, (x, y) => y > 1 && y < 8 && Math.abs(x - 8) < (y - 1) * 1.05, C.red2, C.red3, C.red1);
    box(c, 4, 8, 8, 6, C.bon1, C.bon2, C.bon0);
    rect(c, 7, 10, 2, 4, C.wod1);
    rect(c, 5, 9, 1, 2, C.blu3);
    rect(c, 10, 9, 1, 2, C.blu3);
  },
  rio(c) {
    for (const y of [4, 8, 12])
      for (let x = 1; x < 15; x++) {
        const yy = y + Math.round(Math.sin(x / 1.8) * 1);
        px(c, x, yy, C.blu4);
        px(c, x, yy + 1, C.blu2);
      }
  },
  huerto(c) {
    rect(c, 1, 12, 14, 3, C.wod1);
    hline(c, 1, 12, 14, C.wod2);
    for (const x of [4, 8, 12]) {
      vline(c, x, 7, 5, C.grn2);
      disc(c, x - 1, 7, 1, C.grn3);
      disc(c, x + 1, 6, 1, C.grn4);
    }
  },
  colegio(c) {
    box(c, 2, 6, 12, 8, C.amb2, C.amb3, C.amb1);
    rect(c, 6, 3, 4, 3, C.amb1);
    for (const x of [4, 10]) rect(c, x, 8, 2, 2, C.blu3);
    rect(c, 7, 10, 2, 4, C.wod1);
    vline(c, 8, 0, 3, C.con3);
    rect(c, 9, 0, 3, 2, C.red2);
  },
  bunker(c) {
    box(c, 2, 6, 12, 8, C.con2, C.con4, C.con0);
    disc(c, 8, 10, 3, C.met4);
    disc(c, 8, 10, 2, C.met2);
    hline(c, 5, 10, 7, C.met4);
    vline(c, 8, 7, 7, C.met4);
    rect(c, 2, 3, 12, 3, C.hazard);
    for (let x = 2; x < 14; x += 3) px(c, x, 4, C.ink);
  },
};

const cache = new Map<string, string>();

/** Data URL del icono (16×16). */
export function iconUrl(name: string): string {
  const hit = cache.get(name);
  if (hit) return hit;
  const cv = document.createElement('canvas');
  cv.width = S;
  cv.height = S;
  const c = cv.getContext('2d')!;
  (ICONS[name] ?? ICONS.alerta)(c);
  const url = cv.toDataURL();
  cache.set(name, url);
  return url;
}
