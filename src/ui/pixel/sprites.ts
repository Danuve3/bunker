/**
 * Sprites pixel art dibujados por código: superviviente, módulos, casa y atrezo.
 * Coordenadas en píxeles de la escena de baja resolución. `fy` = línea del suelo.
 */
import type { ModuleType } from '../../core/types';
import { C, box, disc, hash, hline, px, rect, vline, type Ctx } from './gfx';

export interface SpriteState {
  t: number; // ms
  on: boolean; // funciona / encendido
  broken: boolean;
  level: number; // 0..1 (agua, batería, crecimiento)
  lit: boolean;
}

const blink = (t: number, period: number, duty = 0.5) => (t % period) / period < duty;

// ─── Superviviente ───────────────────────────────────────────────────────────
export interface SurvivorLook {
  sleeping: boolean;
  sick: boolean;
  hurt: boolean;
  t: number;
}

export function survivor(c: Ctx, x: number, fy: number, look: SurvivorLook) {
  const skin = look.sick ? '#b9c48a' : C.skn1;
  const skinLo = look.sick ? '#8a9a60' : C.skn0;
  if (look.sleeping) {
    // Tumbado sobre una esterilla
    rect(c, x - 2, fy - 2, 18, 2, C.blu1);
    hline(c, x - 2, fy - 2, 18, C.blu2);
    rect(c, x, fy - 5, 4, 3, skin); // cabeza
    rect(c, x, fy - 6, 4, 2, C.red2); // gorro
    px(c, x + 3, fy - 4, C.ink);
    rect(c, x + 4, fy - 5, 10, 3, C.olv1); // cuerpo con manta
    hline(c, x + 4, fy - 5, 10, C.olv2);
    rect(c, x + 6, fy - 6, 9, 2, C.red1); // manta
    hline(c, x + 6, fy - 6, 9, C.red2);
    // Zzz que suben
    const k = Math.floor(look.t / 600) % 3;
    for (let i = 0; i <= k; i++) {
      const zx = x + 3 + i * 4;
      const zy = fy - 10 - i * 4;
      hline(c, zx, zy, 3, C.bon2);
      px(c, zx + 1, zy + 1, C.bon2);
      hline(c, zx, zy + 2, 3, C.bon2);
    }
    return;
  }
  const bob = Math.floor(look.t / 700) % 2; // respiración
  const y = fy - 14;
  // botas y pantalón
  rect(c, x + 1, fy - 2, 2, 2, C.ink2);
  rect(c, x + 4, fy - 2, 2, 2, C.ink2);
  rect(c, x + 1, fy - 5, 2, 3, C.con1);
  rect(c, x + 4, fy - 5, 2, 3, C.con1);
  // chaqueta
  rect(c, x, y + 6 + bob, 7, 4 - bob + 1, C.olv1);
  hline(c, x, y + 6 + bob, 7, C.olv2);
  vline(c, x + 6, y + 6 + bob, 4 - bob + 1, C.olv0);
  px(c, x + 3, y + 7 + bob, C.olv0); // cremallera
  px(c, x + 3, y + 9, C.olv0);
  // brazos y manos
  vline(c, x - 1, y + 7 + bob, 3, C.olv1);
  vline(c, x + 7, y + 7 + bob, 3, C.olv0);
  px(c, x - 1, y + 10 + bob, skin);
  px(c, x + 7, y + 10 + bob, skinLo);
  // cabeza
  rect(c, x + 1, y + 2 + bob, 5, 4, skin);
  vline(c, x + 1, y + 2 + bob, 4, skinLo);
  px(c, x + 4, y + 3 + bob, C.ink); // ojo (mira a la derecha)
  px(c, x + 5, y + 5 + bob, skinLo);
  // gorro de lana
  rect(c, x + 1, y + bob, 5, 2, C.red2);
  hline(c, x + 1, y + bob, 5, C.red3);
  px(c, x + 3, y - 1 + bob, C.red3);
  if (look.hurt) {
    hline(c, x + 1, y + 2 + bob, 5, C.bon2);
    px(c, x + 2, y + 2 + bob, C.red2);
  }
}

// ─── Módulos ─────────────────────────────────────────────────────────────────
type Draw = (c: Ctx, x: number, fy: number, s: SpriteState) => void;

const can = (c: Ctx, x: number, y: number, col: string) => {
  rect(c, x, y, 3, 4, col);
  hline(c, x, y, 3, C.bon2);
  vline(c, x + 2, y + 1, 3, C.ink2);
};

const MODULES: Record<ModuleType, Draw> = {
  dormitorio(c, x, fy) {
    const bx = x + 12;
    // póster en la pared
    box(c, x + 3, fy - 21, 7, 8, C.blu2, C.blu3, C.blu1);
    rect(c, x + 3, fy - 16, 7, 3, C.grn2);
    px(c, x + 7, fy - 19, C.amb3);
    // estructura
    for (const ox of [0, 23]) {
      vline(c, bx + ox, fy - 21, 21, C.met2);
      vline(c, bx + ox + 1, fy - 21, 21, C.met1);
    }
    // litera de abajo
    box(c, bx + 2, fy - 8, 20, 3, C.bon1, C.bon2, C.bon0, null);
    rect(c, bx + 9, fy - 8, 13, 3, C.red1);
    hline(c, bx + 9, fy - 8, 13, C.red2);
    rect(c, bx + 3, fy - 9, 4, 2, C.bon2);
    hline(c, bx, fy - 5, 25, C.met3);
    // litera de arriba
    box(c, bx + 2, fy - 18, 20, 3, C.bon1, C.bon2, C.bon0, null);
    rect(c, bx + 9, fy - 18, 13, 3, C.blu1);
    hline(c, bx + 9, fy - 18, 13, C.blu2);
    rect(c, bx + 3, fy - 19, 4, 2, C.bon2);
    hline(c, bx, fy - 15, 25, C.met3);
  },
  despensa(c, x, fy) {
    const sx = x + 13;
    const w = 23;
    vline(c, sx, fy - 23, 23, C.met2);
    vline(c, sx + w, fy - 23, 23, C.met1);
    const cols = [C.red2, C.yel, C.grn3, C.blu3, C.amb2, C.bon1, C.red1, C.grn2];
    [fy - 1, fy - 8, fy - 15, fy - 22].forEach((sy, i) => {
      hline(c, sx, sy, w + 1, C.met3);
      hline(c, sx, sy + 1, w + 1, C.met1);
      if (i === 0) return;
      for (let k = 0; k < 5; k++) if (hash(k, i, 7) > 0.15) can(c, sx + 2 + k * 4, sy - 4, cols[(k + i * 3) % cols.length]);
    });
    // sacos de arroz
    for (const [ox, col] of [
      [3, C.bon1],
      [7, C.bon0],
    ] as const) {
      rect(c, x + ox, fy - 7, 5, 7, col);
      hline(c, x + ox, fy - 7, 5, C.bon2);
      rect(c, x + ox + 1, fy - 4, 3, 2, C.amb1);
    }
  },
  deposito_agua(c, x, fy, s) {
    const tx = x + 14;
    const tw = 18;
    const th = 22;
    const ty = fy - th;
    rect(c, tx + 1, ty - 1, tw - 2, 1, C.ink);
    rect(c, tx - 1, ty + 1, tw + 2, th - 1, C.ink);
    rect(c, tx, ty, tw, th, C.met2);
    vline(c, tx + 2, ty + 1, th - 2, C.met4);
    vline(c, tx + 3, ty + 1, th - 2, C.met3);
    vline(c, tx + tw - 2, ty + 1, th - 2, C.met1);
    hline(c, tx, ty + 7, tw, C.met1);
    hline(c, tx, ty + 15, tw, C.met1);
    // visor con el nivel
    const gx = tx + 9;
    rect(c, gx - 1, ty + 2, 5, th - 4, C.ink);
    rect(c, gx, ty + 3, 3, th - 6, C.blu0);
    const lh = Math.round((th - 6) * Math.max(0, Math.min(1, s.level)));
    if (lh > 0) {
      rect(c, gx, ty + 3 + (th - 6) - lh, 3, lh, C.blu2);
      hline(c, gx, ty + 3 + (th - 6) - lh, 3, Math.floor(s.t / 400) % 2 ? C.blu4 : C.blu3);
    }
    // tubería y válvula
    rect(c, tx + 13, 2 + (fy - 27), 2, ty - (fy - 25), C.met3);
    disc(c, tx + tw + 1, fy - 8, 2, C.red2);
    px(c, tx + tw + 1, fy - 8, C.red0);
  },
  generador(c, x, fy, s) {
    const j = s.on && !s.broken && Math.floor(s.t / 70) % 2 ? 1 : 0;
    const gx = x + 13 + j;
    // escape hasta el techo
    rect(c, x + 31, fy - 27, 2, 14, C.met2);
    vline(c, x + 31, fy - 27, 14, C.met3);
    // bidón
    box(c, x + 4, fy - 8, 5, 8, C.red2, C.red3, C.red1);
    rect(c, x + 5, fy - 10, 3, 2, C.red1);
    // cuerpo
    box(c, gx, fy - 13, 20, 12, C.amb2, C.amb3, C.amb1);
    rect(c, gx + 2, fy - 11, 9, 8, C.con0);
    for (let k = 0; k < 4; k++) vline(c, gx + 3 + k * 2, fy - 10, 6, C.con2);
    box(c, gx + 13, fy - 11, 5, 5, C.con1, C.con3, C.con0, null);
    px(c, gx + 15, fy - 9, s.broken ? (blink(s.t, 500) ? C.red3 : C.red0) : s.on ? (blink(s.t, 900, 0.7) ? C.grn4 : C.grn2) : C.con0);
    rect(c, gx + 1, fy - 1, 3, 1, C.ink);
    rect(c, gx + 16, fy - 1, 3, 1, C.ink);
    if (s.on && !s.broken) {
      // líneas de vibración y humo en la junta del escape
      if (Math.floor(s.t / 140) % 2) {
        px(c, gx - 2, fy - 9, C.bon0);
        px(c, gx + 21, fy - 7, C.bon0);
      }
      const p = (s.t / 1200) % 1;
      px(c, x + 34, fy - 16 - Math.floor(p * 8), p < 0.8 ? C.con4 : C.con3);
    }
  },
  baterias(c, x, fy, s) {
    hline(c, x + 12, fy - 1, 24, C.met1);
    for (let k = 0; k < 3; k++) {
      const bx = x + 13 + k * 8;
      box(c, bx, fy - 11, 6, 10, C.con1, C.con3, C.con0);
      px(c, bx + 1, fy - 12, C.red2);
      px(c, bx + 4, fy - 12, C.ink2);
      hline(c, bx + 1, fy - 7, 4, C.hazard);
    }
    // barra de carga en la pared
    box(c, x + 13, fy - 21, 22, 5, C.ink2, C.con1, C.con0, C.ink);
    const n = Math.round(Math.max(0, Math.min(1, s.level)) * 10);
    for (let k = 0; k < 10; k++) rect(c, x + 14 + k * 2, fy - 20, 1, 3, k < n ? (n <= 2 ? C.red2 : n <= 4 ? C.amb2 : C.grn3) : C.con1);
    vline(c, x + 24, fy - 27, 6, C.ink2); // cable
  },
  ventilacion(c, x, fy, s) {
    // conducto al techo
    rect(c, x + 22, fy - 27, 6, 7, C.met2);
    vline(c, x + 22, fy - 27, 7, C.met3);
    hline(c, x + 22, fy - 23, 6, C.met1);
    // carcasa
    box(c, x + 14, fy - 20, 22, 14, C.met2, C.met3, C.met1);
    disc(c, x + 25, fy - 13, 5, C.ink2);
    // aspas (4 fotogramas)
    const f = s.on && !s.broken ? Math.floor(s.t / 60) % 4 : 0;
    const blades: [number, number][][] = [
      [[0, -4], [0, -3], [0, 3], [0, 4], [-4, 0], [-3, 0], [3, 0], [4, 0]],
      [[-3, -3], [-2, -2], [2, 2], [3, 3], [-3, 3], [-2, 2], [2, -2], [3, -3]],
      [[1, -4], [1, -3], [-1, 3], [-1, 4], [-4, -1], [-3, -1], [3, 1], [4, 1]],
      [[-2, -4], [-1, -3], [1, 3], [2, 4], [-4, 2], [-3, 1], [3, -1], [4, -2]],
    ];
    for (const [dx, dy] of blades[f]) px(c, x + 25 + dx, fy - 13 + dy, C.met4);
    px(c, x + 25, fy - 13, C.bon2);
    // filtro
    rect(c, x + 16, fy - 6, 18, 5, C.bon0);
    for (let k = 0; k < 9; k++) px(c, x + 16 + k * 2, fy - 5, C.bon1);
    hline(c, x + 16, fy - 2, 18, C.con1);
  },
  letrina(c, x, fy) {
    const lx = x + 20;
    box(c, lx, fy - 23, 14, 23, C.blu2, C.blu3, C.blu1);
    rect(c, lx - 1, fy - 25, 16, 2, C.blu3);
    rect(c, lx + 2, fy - 20, 10, 18, C.blu1);
    vline(c, lx + 2, fy - 20, 18, C.blu3);
    for (let k = 0; k < 3; k++) hline(c, lx + 4, fy - 18 + k * 2, 6, C.blu0);
    px(c, lx + 10, fy - 10, C.bon2);
    // papel higiénico
    rect(c, x + 13, fy - 5, 4, 4, C.bon2);
    px(c, x + 15, fy - 3, C.bon0);
  },
  enfermeria(c, x, fy) {
    // armario con cruz
    box(c, x + 4, fy - 22, 8, 10, C.bon2, C.bon2, C.bon0);
    rect(c, x + 7, fy - 20, 2, 6, C.red2);
    rect(c, x + 5, fy - 18, 6, 2, C.red2);
    // camilla
    hline(c, x + 13, fy - 8, 20, C.met3);
    box(c, x + 13, fy - 11, 20, 3, C.bon1, C.bon2, C.bon0, null);
    rect(c, x + 20, fy - 11, 13, 3, C.grn2);
    hline(c, x + 20, fy - 11, 13, C.grn3);
    rect(c, x + 14, fy - 12, 4, 2, C.bon2);
    vline(c, x + 14, fy - 7, 7, C.met2);
    vline(c, x + 31, fy - 7, 7, C.met2);
    // gotero
    vline(c, x + 35, fy - 22, 22, C.met4);
    hline(c, x + 33, fy - 1, 5, C.met2);
    box(c, x + 34, fy - 21, 3, 4, C.blu4, C.bon2, C.blu3, null);
  },
  taller(c, x, fy) {
    // panel de herramientas
    box(c, x + 6, fy - 24, 28, 10, C.wod3, C.wod3, C.wod2);
    for (let k = 0; k < 13; k++) px(c, x + 7 + k * 2, fy - 16, C.wod1);
    rect(c, x + 9, fy - 22, 1, 6, C.wod1);
    rect(c, x + 8, fy - 22, 3, 2, C.met3); // martillo
    rect(c, x + 14, fy - 22, 6, 3, C.met4); // sierra
    for (let k = 0; k < 3; k++) px(c, x + 14 + k * 2, fy - 19, C.met2);
    rect(c, x + 24, fy - 22, 1, 5, C.met3); // llave
    rect(c, x + 23, fy - 22, 3, 1, C.met3);
    px(c, x + 30, fy - 21, C.red2);
    // banco
    box(c, x + 5, fy - 10, 30, 3, C.wod2, C.wod3, C.wod1);
    rect(c, x + 6, fy - 7, 2, 7, C.wod1);
    rect(c, x + 32, fy - 7, 2, 7, C.wod1);
    box(c, x + 8, fy - 13, 4, 3, C.met2, C.met3, C.met1, null); // tornillo de banco
    box(c, x + 22, fy - 5, 8, 5, C.red2, C.red3, C.red1); // caja de herramientas
    hline(c, x + 24, fy - 6, 4, C.ink2);
  },
  hidroponico(c, x, fy, s) {
    const g = Math.max(0.15, Math.min(1, s.level));
    vline(c, x + 8, fy - 25, 25, C.met2);
    vline(c, x + 34, fy - 25, 25, C.met2);
    for (const ty of [fy - 2, fy - 13]) {
      const glow = s.on && !s.broken ? (Math.floor(s.t / 900) % 2 ? C.pnk : C.pur) : C.con1;
      hline(c, x + 9, ty - 11, 25, glow);
      hline(c, x + 9, ty, 25, C.bon1);
      hline(c, x + 9, ty + 1, 25, C.met1);
      for (let k = 0; k < 6; k++) {
        const pxx = x + 11 + k * 4;
        const h = Math.max(1, Math.round(6 * g * (0.7 + hash(k, ty, 3) * 0.5)));
        vline(c, pxx, ty - h, h, C.grn2);
        px(c, pxx - 1, ty - h + 1, C.grn3);
        px(c, pxx + 1, ty - h, C.grn4);
        if (g > 0.9 && k % 2) px(c, pxx, ty - h - 1, C.red2);
      }
    }
  },
  radio(c, x, fy, s) {
    // mesa
    box(c, x + 8, fy - 9, 26, 2, C.wod2, C.wod3, C.wod1);
    rect(c, x + 9, fy - 7, 2, 7, C.wod1);
    rect(c, x + 31, fy - 7, 2, 7, C.wod1);
    // emisora
    box(c, x + 12, fy - 17, 16, 8, C.con1, C.con3, C.con0);
    rect(c, x + 14, fy - 15, 6, 3, s.on ? C.grn3 : C.con0);
    if (s.on) px(c, x + 15 + (Math.floor(s.t / 300) % 4), fy - 14, C.grn4);
    for (let k = 0; k < 3; k++) px(c, x + 22 + k * 2, fy - 14, C.met4);
    hline(c, x + 14, fy - 11, 12, C.con2);
    px(c, x + 26, fy - 16, s.on && blink(s.t, 1200, 0.3) ? C.red3 : C.red0);
    // micro y cable de antena
    vline(c, x + 31, fy - 14, 5, C.met2);
    rect(c, x + 30, fy - 16, 3, 2, C.ink2);
    vline(c, x + 20, fy - 27, 10, C.ink2);
  },
  esclusa(c, x, fy, s) {
    // franjas de peligro en el suelo
    for (let k = 0; k < 36; k++) px(c, x + 2 + k, fy - 1, Math.floor((k + 0) / 3) % 2 ? C.hazard : C.ink);
    // ducha de descontaminación
    rect(c, x + 6, fy - 27, 1, 4, C.met3);
    rect(c, x + 4, fy - 23, 5, 1, C.met4);
    if (s.on) for (let k = 0; k < 3; k++) px(c, x + 4 + k * 2, fy - 21 + ((Math.floor(s.t / 120) + k * 3) % 18), C.blu4);
    // cortinas de lamas
    for (let k = 0; k < 7; k++) {
      const lx = x + 12 + k * 3;
      rect(c, lx, fy - 25, 2, 23, k % 2 ? 'rgba(214,204,180,0.55)' : 'rgba(165,154,133,0.6)');
    }
    hline(c, x + 11, fy - 26, 22, C.met3);
  },
  puerta_blindada(c, x, fy) {
    box(c, x + 9, fy - 25, 22, 25, C.con3, C.con4, C.con1);
    box(c, x + 11, fy - 23, 18, 23, C.met2, C.met3, C.met1, null);
    for (const ry of [fy - 21, fy - 12, fy - 3]) {
      hline(c, x + 11, ry, 18, C.met1);
      px(c, x + 12, ry - 1, C.met4);
      px(c, x + 27, ry - 1, C.met4);
    }
    // volante
    disc(c, x + 22, fy - 12, 4, C.met4);
    disc(c, x + 22, fy - 12, 3, C.met2);
    hline(c, x + 18, fy - 12, 9, C.met4);
    vline(c, x + 22, fy - 16, 9, C.met4);
    px(c, x + 22, fy - 12, C.ink);
    // bisagras y señal
    rect(c, x + 10, fy - 20, 2, 3, C.ink2);
    rect(c, x + 10, fy - 6, 2, 3, C.ink2);
    px(c, x + 33, fy - 22, C.hazard);
    hline(c, x + 32, fy - 21, 3, C.hazard);
    hline(c, x + 31, fy - 20, 5, C.hazard);
  },
  periscopio(c, x, fy) {
    rect(c, x + 23, fy - 27, 3, 15, C.met2);
    vline(c, x + 23, fy - 27, 15, C.met3);
    box(c, x + 20, fy - 13, 9, 5, C.met2, C.met3, C.met1);
    rect(c, x + 16, fy - 11, 4, 1, C.met3);
    rect(c, x + 29, fy - 11, 4, 1, C.met3);
    rect(c, x + 16, fy - 12, 1, 3, C.met1);
    rect(c, x + 32, fy - 12, 1, 3, C.met1);
    px(c, x + 22, fy - 11, C.blu4);
    // taburete
    box(c, x + 21, fy - 5, 7, 1, C.wod2, C.wod3, C.wod1, null);
    vline(c, x + 22, fy - 4, 4, C.wod1);
    vline(c, x + 26, fy - 4, 4, C.wod1);
  },
  ocio(c, x, fy, s) {
    // estantería de libros
    box(c, x + 4, fy - 24, 10, 16, C.wod1, C.wod2, C.wod0);
    const books = [C.red2, C.blu3, C.grn3, C.yel, C.amb2, C.pnk];
    for (const sy of [fy - 22, fy - 15]) for (let k = 0; k < 4; k++) rect(c, x + 5 + k * 2, sy, 2, 5, books[(k + sy) % books.length]);
    // sillón
    box(c, x + 18, fy - 9, 12, 6, C.red1, C.red2, C.red0);
    box(c, x + 17, fy - 14, 3, 11, C.red1, C.red2, C.red0);
    rect(c, x + 19, fy - 3, 2, 3, C.wod0);
    rect(c, x + 27, fy - 3, 2, 3, C.wod0);
    // lámpara de pie
    vline(c, x + 34, fy - 18, 18, C.met1);
    rect(c, x + 31, fy - 21, 7, 4, s.lit ? C.amb3 : C.amb1);
    hline(c, x + 31, fy - 21, 7, s.lit ? C.amb4 : C.amb2);
    // planta
    rect(c, x + 14, fy - 4, 3, 4, C.red1);
    px(c, x + 15, fy - 6, C.grn3);
    px(c, x + 14, fy - 5, C.grn2);
    px(c, x + 16, fy - 7, C.grn4);
  },
  purificador(c, x, fy, s) {
    for (const ox of [14, 24]) {
      box(c, x + ox, fy - 20, 7, 18, C.met3, C.met4, C.met2);
      rect(c, x + ox + 2, fy - 17, 3, 10, C.blu1);
      const lvl = 3 + (Math.floor(s.t / 500) % 3);
      rect(c, x + ox + 2, fy - 7 - lvl, 3, lvl, C.blu3);
      hline(c, x + ox, fy - 2, 7, C.met1);
    }
    hline(c, x + 21, fy - 14, 3, C.met2);
    // bidones
    box(c, x + 4, fy - 7, 6, 7, C.blu2, C.blu3, C.blu1);
    rect(c, x + 6, fy - 9, 2, 2, C.blu1);
    // grifo con gota
    rect(c, x + 31, fy - 12, 3, 1, C.met4);
    px(c, x + 33, fy - 11 + (Math.floor(s.t / 250) % 6), C.blu4);
  },
};

export function moduleSprite(c: Ctx, type: ModuleType, x: number, fy: number, s: SpriteState) {
  MODULES[type](c, x, fy, s);
  if (s.broken) {
    // chispas y baliza roja
    if (blink(s.t, 600)) disc(c, x + 36, fy - 25, 1, C.red3);
    for (let k = 0; k < 3; k++) {
      const h = hash(Math.floor(s.t / 90), k, 11);
      if (h > 0.55) px(c, x + 14 + Math.floor(h * 20), fy - 6 - Math.floor(hash(k, Math.floor(s.t / 90), 5) * 14), C.amb4);
    }
  }
}

// ─── Casa ────────────────────────────────────────────────────────────────────
export interface HouseLook {
  night: boolean;
  lightsInside: boolean;
  boarded: boolean;
  snow: boolean;
  ash: boolean;
}

export function house(c: Ctx, x0: number, gy: number, w: number, look: HouseLook) {
  const wallH = 30;
  const top = gy - wallH;
  const plaster = look.night ? '#7d7362' : '#cbbd9d';
  const plasterHi = look.night ? '#8d8370' : '#ddd1b3';
  const plasterLo = look.night ? '#5f5749' : '#a99b7c';
  // muro
  rect(c, x0 - 1, top - 1, w + 2, wallH + 1, C.ink);
  rect(c, x0, top, w, wallH, plaster);
  for (let y = top + 2; y < gy - 3; y += 4) for (let x = x0 + ((y >> 2) % 2) * 3; x < x0 + w; x += 7) px(c, x, y, plasterLo);
  vline(c, x0, top, wallH, plasterHi);
  vline(c, x0 + w - 1, top, wallH, plasterLo);
  // zócalo
  rect(c, x0, gy - 4, w, 4, C.con3);
  hline(c, x0, gy - 4, w, C.con4);
  // tejado
  const ov = 5;
  const rh = 20;
  for (let j = 0; j < rh; j++) {
    const left = x0 - ov + Math.round(((rh - 1 - j) / rh) * (w / 2 + ov));
    const right = x0 + w + ov - Math.round(((rh - 1 - j) / rh) * (w / 2 + ov));
    const y = top - rh + j;
    rect(c, left - 1, y, right - left + 2, 1, C.ink);
    for (let x = left; x < right; x++) {
      const tile = ((x + (j % 4 < 2 ? 0 : 2)) % 4 === 0) || j % 4 === 3;
      px(c, x, y, tile ? C.red0 : j % 4 === 0 ? C.red2 : C.red1);
    }
    if (look.snow && j < rh) {
      if (j % 4 === 0 || j < 2) for (let x = left; x < right; x += 1) if (hash(x, y, 4) > 0.25) px(c, x, y, C.bon2);
    } else if (look.ash && j % 4 === 0) for (let x = left; x < right; x++) if (hash(x, y, 9) > 0.45) px(c, x, y, C.bon0);
  }
  hline(c, x0 - ov - 1, top, w + ov * 2 + 2, C.ink);
  // chimenea
  const chx = x0 + w - 24;
  rect(c, chx - 1, top - rh - 2, 8, 12, C.ink);
  rect(c, chx, top - rh - 1, 6, 10, C.red1);
  hline(c, chx, top - rh - 1, 6, C.red2);
  rect(c, chx - 1, top - rh - 3, 8, 2, C.con2);
  // ventanas
  const win = (wx: number, wy: number) => {
    rect(c, wx - 1, wy - 1, 13, 11, C.ink);
    rect(c, wx, wy, 11, 9, C.bon2);
    const glass = look.lightsInside && look.night ? C.amb3 : look.night ? C.blu0 : C.blu2;
    rect(c, wx + 1, wy + 1, 4, 3, glass);
    rect(c, wx + 6, wy + 1, 4, 3, glass);
    rect(c, wx + 1, wy + 5, 4, 3, glass);
    rect(c, wx + 6, wy + 5, 4, 3, glass);
    if (!look.night) {
      px(c, wx + 1, wy + 1, C.blu4);
      px(c, wx + 6, wy + 1, C.blu4);
    }
    // contraventanas
    rect(c, wx - 4, wy, 3, 9, C.olv1);
    rect(c, wx + 12, wy, 3, 9, C.olv1);
    hline(c, wx - 2, wy + 10, 15, C.con4);
    if (look.boarded) {
      rect(c, wx - 1, wy + 2, 13, 2, C.wod2);
      rect(c, wx - 1, wy + 6, 13, 2, C.wod2);
      px(c, wx + 1, wy + 2, C.ink);
      px(c, wx + 9, wy + 6, C.ink);
    }
  };
  win(x0 + 10, top + 7);
  win(x0 + w - 24, top + 7);
  // puerta
  const dx = x0 + Math.floor(w / 2) - 5;
  rect(c, dx - 1, gy - 22, 12, 22, C.ink);
  rect(c, dx, gy - 21, 10, 21, C.wod1);
  rect(c, dx + 1, gy - 20, 8, 8, C.wod2);
  rect(c, dx + 1, gy - 10, 8, 8, C.wod2);
  px(c, dx + 8, gy - 11, C.amb3);
  rect(c, dx - 3, gy - 1, 16, 1, C.con4);
  // ventanuco del ático
  disc(c, x0 + w / 2, top - 8, 3, C.ink);
  disc(c, x0 + w / 2, top - 8, 2, look.night ? C.blu0 : C.blu2);
}

export function tree(c: Ctx, x: number, gy: number, kind: 'leafy' | 'dead' | 'snowy') {
  rect(c, x - 1, gy - 18, 3, 18, C.wod0);
  vline(c, x - 1, gy - 18, 18, C.wod1);
  if (kind === 'dead') {
    for (const [dx, dy, l] of [
      [-1, -14, 5],
      [2, -17, 4],
      [-1, -20, 3],
    ] as const)
      for (let k = 0; k < l; k++) px(c, x + (dx < 0 ? -k : k) + dx, gy + dy - k, C.wod1);
    return;
  }
  const blobs: [number, number, number][] = [
    [0, -24, 7],
    [-5, -20, 5],
    [5, -20, 5],
    [0, -29, 5],
  ];
  for (const [dx, dy, r] of blobs) disc(c, x + dx, gy + dy, r, C.grn1);
  for (const [dx, dy, r] of blobs) disc(c, x + dx - 1, gy + dy - 1, r - 2, kind === 'snowy' ? '#5c7a5a' : C.grn2);
  for (let k = 0; k < 14; k++) {
    const h = hash(k, x, 2);
    px(c, x - 6 + Math.floor(h * 12), gy - 32 + Math.floor(hash(k, 3, x) * 14), kind === 'snowy' ? C.bon2 : C.grn3);
  }
  if (kind === 'snowy') for (const [dx, dy, r] of blobs) hline(c, x + dx - r + 2, gy + dy - r, r * 2 - 3, C.bon2);
}

export function car(c: Ctx, x: number, gy: number, col: string, colHi: string, colLo: string, dead: boolean) {
  rect(c, x - 1, gy - 9, 24, 7, C.ink);
  rect(c, x, gy - 8, 22, 5, col);
  hline(c, x, gy - 8, 22, colHi);
  hline(c, x, gy - 4, 22, colLo);
  rect(c, x + 4, gy - 13, 13, 5, C.ink);
  rect(c, x + 5, gy - 12, 11, 4, col);
  rect(c, x + 6, gy - 11, 4, 3, dead ? C.con1 : C.blu3);
  rect(c, x + 11, gy - 11, 4, 3, dead ? C.con1 : C.blu3);
  for (const wx of [5, 17]) {
    disc(c, x + wx, gy - 2, 2, C.ink);
    px(c, x + wx, gy - 2, C.con3);
  }
  px(c, x + 21, gy - 7, dead ? C.con2 : C.amb3);
}

export function sandbags(c: Ctx, x: number, gy: number, w: number, layers: number, mound: boolean) {
  for (let l = 0; l < layers; l++) {
    const inset = mound ? l * 3 : 0;
    const y = gy - 3 - l * 3;
    for (let bx = x + inset + (l % 2) * 3; bx + 5 <= x + w - inset; bx += 6) {
      rect(c, bx, y, 6, 3, C.ink2);
      rect(c, bx, y, 5, 2, C.bon0);
      hline(c, bx, y, 5, C.bon1);
      px(c, bx + 2, y + 1, C.wod2);
    }
  }
}
