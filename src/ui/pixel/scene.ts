/**
 * Renderizador pixel art del búnker en corte lateral.
 * Dibuja a baja resolución (40×30 px por celda) y escala sin suavizado; encima,
 * una pasada de luz a resolución de pantalla (resplandores cálidos de las lámparas).
 */
import { idx, moduleAt, shelterCell, underHouse, batteryCapacityWh, canDig } from '../../core/bunker';
import { clockHour, gridUp, modActive } from '../../core/env';
import type { Bunker, CellKind, GameState } from '../../core/types';
import { C, bayer, ctx2d, disc, hash, hline, makeCanvas, px, rect, vline, vnoise, type Ctx } from './gfx';
import { car, house, moduleSprite, sandbags, survivor, tree, type SpriteState } from './sprites';

export const CW = 40;
export const CH = 30;
export const SKY = 84;

export const sceneSize = (b: Bunker) => ({ w: b.cols * CW, h: SKY + (b.rows - 1) * CH });

export type SkyKey = 'normal' | 'nuclear' | 'pandemia' | 'colapso' | 'frio' | 'inundacion' | 'tormenta_solar';
export type TimeOfDay = 'night' | 'dawn' | 'day' | 'dusk';

export function timeOfDay(hour: number): TimeOfDay {
  if (hour >= 21 || hour < 6) return 'night';
  if (hour < 8) return 'dawn';
  if (hour < 19) return 'day';
  return 'dusk';
}

const SKIES: Record<SkyKey, Partial<Record<TimeOfDay, string[]>>> = {
  normal: {
    day: ['#2f6fa8', '#4b8cc2', '#73aed6', '#a8cfe2', '#e3dcc0'],
    dawn: ['#25305e', '#5a4a7a', '#b8677a', '#ec9a6a', '#f6cf86'],
    dusk: ['#1f2452', '#4b3468', '#a24c66', '#e47a50', '#f2b062'],
    night: ['#05070f', '#0a0f1f', '#111a33', '#1b2747'],
  },
  pandemia: {
    day: ['#45708f', '#5f88a4', '#86a7b8', '#b6c8cc', '#dcd6c0'],
    night: ['#05070d', '#0a0e1a', '#121a2b', '#1c263b'],
  },
  nuclear: {
    day: ['#241c18', '#3d2f26', '#5e4635', '#8a6748', '#b38a5c'],
    dawn: ['#1a1210', '#3a2418', '#6e3a22', '#a85a2c', '#c98a4a'],
    dusk: ['#1a1210', '#3a2418', '#6e3a22', '#a85a2c', '#c98a4a'],
    night: ['#080605', '#120d0a', '#1d1510', '#2a1e16'],
  },
  colapso: {
    day: ['#3b434b', '#59616a', '#7c7f7d', '#a49985', '#c4a77e'],
    night: ['#040508', '#0a0c12', '#15151b', '#2b1a12', '#5a2a12'],
  },
  frio: {
    day: ['#7f9db6', '#9fb9cd', '#c0d4e2', '#dfe9f0', '#f2f6f8'],
    night: ['#050b17', '#0b162b', '#142441', '#22375a'],
  },
  inundacion: {
    day: ['#20272e', '#323c45', '#47535d', '#5e6b75', '#76838c'],
    night: ['#030507', '#080b10', '#0f141b', '#181f28'],
  },
  tormenta_solar: {
    day: ['#3a6e9b', '#5589b5', '#7ba7c8', '#a8c6d6', '#d9d6bf'],
    night: ['#02060e', '#05101f', '#0a1a30', '#102540'],
  },
};

function skyColors(key: SkyKey, tod: TimeOfDay): string[] {
  const set = SKIES[key];
  return set[tod] ?? (tod === 'dawn' || tod === 'dusk' ? set.day ?? SKIES.normal[tod]! : set.night ?? SKIES.normal.night!);
}

export interface Look {
  key: SkyKey;
  after: boolean;
  tod: TimeOfDay;
  hoursSince: number;
  flood: boolean;
  blackout: boolean;
  seed: number;
}

export function lookFor(s: GameState): Look {
  const after = s.h >= s.threat.eventH;
  const key: SkyKey = after ? ((s.threat.variant ?? s.threat.primary) as SkyKey) : 'normal';
  return {
    key,
    after,
    tod: timeOfDay(clockHour(s)),
    hoursSince: s.h - s.threat.eventH,
    flood: modActive(s, 'flood'),
    blackout: after && !gridUp(s),
    seed: hashSeed(s.seed),
  };
}

function hashSeed(str: string) {
  let h = 7;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h) % 9973;
}

// ─── Capas del cielo ─────────────────────────────────────────────────────────
export function drawSky(c: Ctx, W: number, look: Look, t: number, reduced: boolean) {
  const cols = skyColors(look.key, look.tod);
  const H = SKY - 6;
  const n = cols.length - 1;
  for (let j = 0; j < H; j++) {
    const f = (j / (H - 1)) * n;
    const i = Math.min(n - 1, Math.floor(f));
    const tt = f - i;
    c.fillStyle = cols[i];
    c.fillRect(0, j, W, 1);
    c.fillStyle = cols[i + 1];
    for (let x = 0; x < W; x++) if (bayer(x, j, tt)) c.fillRect(x, j, 1, 1);
  }
  const night = look.tod === 'night';
  // estrellas
  if (night && look.key !== 'inundacion' && look.key !== 'nuclear') {
    for (let k = 0; k < 70; k++) {
      const x = Math.floor(hash(k, 1, look.seed) * W);
      const y = Math.floor(hash(k, 2, look.seed) * (H - 26));
      const tw = reduced ? 1 : (Math.floor(t / 400) + k) % 9;
      px(c, x, y, tw === 0 ? '#3a4466' : hash(k, 3) > 0.85 ? '#fff6d6' : '#c9d4ff');
    }
  }
  // sol o luna
  if (night) {
    const mx = W - 44;
    disc(c, mx, 18, 6, look.key === 'nuclear' ? '#8a6a52' : '#e9e2c8');
    disc(c, mx + 3, 16, 5, cols[0]);
  } else if (look.key !== 'inundacion' && look.key !== 'nuclear' && look.key !== 'colapso') {
    const sy = look.tod === 'day' ? 16 : 34;
    disc(c, W - 46, sy, 7, look.tod === 'day' ? '#fff1b8' : '#ffb45a');
    disc(c, W - 46, sy, 5, look.tod === 'day' ? '#fffbe2' : '#ffd38a');
  } else if (look.key === 'nuclear') {
    disc(c, W - 46, 22, 6, '#c96a2a'); // sol rojizo tras la ceniza
  }
  // aurora (tormenta solar de noche)
  if (look.key === 'tormenta_solar' && night) {
    for (let x = 0; x < W; x++) {
      const ph = reduced ? 0 : t / 1600;
      const y1 = 14 + Math.sin(x / 19 + ph) * 6 + Math.sin(x / 7 + ph * 1.7) * 2;
      const len = 10 + Math.sin(x / 11 + ph * 0.6) * 4;
      for (let j = 0; j < len; j++) {
        const yy = Math.floor(y1 + j);
        if (bayer(x, yy, 0.65 - j / len / 1.3)) px(c, x, yy, j < 3 ? '#b6ffcf' : j < len * 0.6 ? '#3fe08a' : '#c04a9a');
      }
    }
  }
  // nubes
  const cloudCol = look.key === 'inundacion' ? '#3c4650' : look.key === 'nuclear' ? '#5a4636' : night ? '#1a2236' : '#e7eef2';
  const cloudLo = look.key === 'inundacion' ? '#2a3239' : look.key === 'nuclear' ? '#3e3027' : night ? '#121827' : '#c6d3dc';
  const nClouds = look.key === 'inundacion' ? 6 : 3;
  for (let k = 0; k < nClouds; k++) {
    const speed = 0.0012 + hash(k, 5) * 0.001;
    const x = Math.floor(((hash(k, 4, look.seed) * W + (reduced ? 0 : t * speed)) % (W + 60)) - 30);
    const y = 8 + Math.floor(hash(k, 6, look.seed) * 26);
    const w = 18 + Math.floor(hash(k, 7) * 18);
    rect(c, x + 3, y, w - 6, 3, cloudCol);
    rect(c, x, y + 3, w, 4, cloudCol);
    rect(c, x + 6, y - 2, w / 3, 2, cloudCol);
    hline(c, x, y + 6, w, cloudLo);
  }
  // hongo nuclear en el horizonte (primeros días)
  if (look.key === 'nuclear' && look.hoursSince < 72) {
    const cx = 34;
    const base = SKY - 18;
    for (let j = 0; j < 30; j++) {
      const w = 3 + Math.floor(j / 10);
      hline(c, cx - w, base - j, w * 2 + 1, j % 3 ? '#6e5240' : '#7d5e48');
    }
    for (let j = 0; j < 14; j++) {
      const w = 8 + Math.floor(Math.sin((j / 14) * Math.PI) * 9);
      for (let x = -w; x <= w; x++) px(c, cx + x, base - 30 - j, bayer(cx + x, j, 0.5 + x / w / 2) ? '#9a7254' : '#b3865e');
    }
  }
  // colinas lejanas
  const hill = night ? '#0d1220' : look.key === 'frio' ? '#a7b9c6' : look.key === 'nuclear' ? '#3a2c22' : '#55705a';
  for (let x = 0; x < W; x++) {
    const h = 10 + Math.floor(vnoise(x, 0, 40, look.seed) * 14);
    vline(c, x, SKY - 6 - h, h, hill);
  }
}

/** Horizonte de ciudad (detrás de la casa). */
export function drawSkyline(c: Ctx, W: number, look: Look, t: number, reduced: boolean) {
  const night = look.tod === 'night' || look.tod === 'dusk';
  const body = night ? '#0b0f1a' : look.key === 'frio' ? '#8495a3' : look.key === 'nuclear' ? '#2c221b' : look.key === 'inundacion' ? '#2a333b' : '#5d6c79';
  const edge = night ? '#151b2c' : look.key === 'frio' ? '#9fb0bd' : look.key === 'nuclear' ? '#3a2d23' : '#71818e';
  const lightsOn = !look.blackout && (look.key === 'normal' || look.key === 'pandemia');
  let x = -4;
  let k = 0;
  while (x < W) {
    const w = 10 + Math.floor(hash(k, 11, look.seed) * 16);
    const h = 12 + Math.floor(hash(k, 12, look.seed) * 22);
    const top = SKY - 6 - h;
    rect(c, x, top, w, h, body);
    hline(c, x, top, w, edge);
    if (look.key === 'frio') hline(c, x, top, w, '#e8f0f4');
    if (hash(k, 13) > 0.6) vline(c, x + 3, top - 4, 4, body); // antena
    for (let wy = top + 3; wy < SKY - 9; wy += 4)
      for (let wx = x + 2; wx < x + w - 2; wx += 3) {
        const on = lightsOn && night && hash(wx, wy, 14) > 0.55;
        px(c, wx, wy, on ? '#e8b85a' : night ? '#121827' : edge);
      }
    // incendios en el colapso
    if (look.key === 'colapso' && hash(k, 15, look.seed) > 0.7) {
      const fx = x + Math.floor(w / 2);
      if (night) for (let j = 0; j < 3; j++) px(c, fx - 1 + j, top + 1, j === 1 ? '#ffb24a' : '#e2552a');
      for (let p = 0; p < 6; p++) {
        const ph = reduced ? p / 6 : ((t / 2400 + p / 6 + hash(k, p)) % 1);
        const yy = top - 2 - Math.floor(ph * 34);
        const xx = fx + Math.floor(Math.sin(ph * 6 + k) * 3 + ph * 6);
        const r = 1 + Math.floor(ph * 3);
        disc(c, xx, yy, r, ph < 0.3 && night ? '#5a2a18' : '#3a3633');
      }
    }
    x += w + 1;
    k++;
  }
}

export function drawGround(c: Ctx, W: number, look: Look, t: number) {
  const y = SKY - 6;
  const snow = look.key === 'frio';
  const ash = look.key === 'nuclear';
  for (let x = 0; x < W; x++) {
    const tuft = hash(x, 1, look.seed) > 0.7 ? 1 : 0;
    const top = snow ? C.bon2 : ash ? '#6d6458' : look.tod === 'night' ? '#2c4a26' : C.grn3;
    const mid = snow ? C.bon1 : ash ? '#585046' : look.tod === 'night' ? '#203a1c' : C.grn2;
    if (tuft && !snow) px(c, x, y - 1, top);
    hline(c, x, y, 1, top);
    vline(c, x, y + 1, 2, mid);
    vline(c, x, y + 3, 3, snow ? '#c8ccc8' : '#3a2a1c');
  }
  // inundación: agua sobre el terreno
  if (look.flood || (look.key === 'inundacion' && look.after)) {
    const lvl = look.flood ? 7 : 3;
    for (let x = 0; x < W; x++) {
      const wave = Math.floor(Math.sin(x / 5 + t / 500) * 1);
      for (let j = 0; j < lvl; j++) px(c, x, y + 1 - lvl + j + (j === 0 ? wave : 0), j === 0 ? C.blu4 : j < 2 ? C.blu3 : C.blu2);
    }
  }
}

// ─── Terreno (ImageData) ─────────────────────────────────────────────────────
const SOIL: Record<Exclude<CellKind, 'hueco'>, number[][]> = {
  tierra: [
    [92, 64, 46],
    [107, 76, 54],
    [80, 55, 38],
    [122, 89, 64],
  ],
  arcilla: [
    [124, 70, 47],
    [143, 86, 57],
    [108, 59, 40],
    [160, 100, 66],
  ],
  roca: [
    [76, 75, 80],
    [94, 93, 99],
    [112, 111, 118],
    [58, 57, 62],
  ],
};

function terrainImage(b: Bunker, seed: number): ImageData {
  const { w, h } = sceneSize(b);
  const img = new ImageData(w, h - SKY);
  const d = img.data;
  // Guijarros dispersos (posiciones con jitter, no en rejilla)
  const pebbles = new Map<number, [number, number]>(); // índice píxel → [tono, luz]
  for (let gy = 0; gy < (h - SKY) / 7; gy++)
    for (let gx = 0; gx < w / 8; gx++) {
      if (hash(gx, gy, seed + 31) > 0.42) continue;
      const cx = gx * 8 + Math.floor(hash(gx, gy, seed + 32) * 7);
      const cy = gy * 7 + Math.floor(hash(gx, gy, seed + 33) * 6);
      const rx = 1 + Math.floor(hash(gx, gy, seed + 34) * 2);
      const ry = hash(gx, gy, seed + 35) > 0.5 ? 1 : 0;
      const tone = hash(gx, gy, seed + 36);
      for (let yy = -ry; yy <= ry; yy++)
        for (let xx = -rx; xx <= rx; xx++) {
          if (Math.abs(xx) === rx && Math.abs(yy) === ry && rx > 1) continue;
          const X = cx + xx;
          const Y = cy + yy;
          if (X < 0 || X >= w || Y < 0 || Y >= h - SKY) continue;
          pebbles.set(Y * w + X, [tone, yy < 0 || (ry === 0 && xx < 0) ? 1 : yy > 0 ? -1 : 0]);
        }
    }
  for (let y = 0; y < h - SKY; y++) {
    const r0 = 1 + Math.floor(y / CH);
    for (let x = 0; x < w; x++) {
      const c0 = Math.floor(x / CW);
      if (b.cells[idx(b, c0, r0)] === 'hueco') continue;
      // Límites ondulados entre estratos: muestrea la celda con coordenadas deformadas
      const wx = Math.max(0, Math.min(w - 1, x + Math.round((vnoise(x, y, 11, seed) - 0.5) * 12)));
      const wy = Math.max(0, Math.min(h - SKY - 1, y + Math.round((vnoise(y, x, 9, seed + 1) - 0.5) * 10)));
      let r = 1 + Math.floor(wy / CH);
      let kind = b.cells[idx(b, Math.floor(wx / CW), r)];
      if (kind === 'hueco') {
        kind = b.cells[idx(b, c0, r0)];
        r = r0;
      }
      const depthF = 1 - 0.07 * (r0 - 1) - (y % CH === 0 ? 0 : 0);
      const pal = SOIL[kind as Exclude<CellKind, 'hueco'>];
      let col: number[];
      if (kind === 'tierra') {
        const n = vnoise(x, y, 7, seed) * 0.55 + vnoise(x, y, 2.5, seed + 2) * 0.3 + hash(x, y, seed) * 0.15;
        col = pal[n < 0.36 ? 2 : n < 0.6 ? 0 : n < 0.78 ? 1 : 3];
        const pb = pebbles.get(y * w + x);
        if (pb) col = pb[1] > 0 ? [176, 160, 134] : pb[1] < 0 ? [96, 84, 70] : pb[0] > 0.5 ? [140, 124, 102] : [122, 112, 100];
      } else if (kind === 'arcilla') {
        const band = Math.sin((y + vnoise(x, y, 16, seed) * 10) / 2.8);
        col = pal[band > 0.55 ? 3 : band > 0 ? 1 : band > -0.6 ? 0 : 2];
        if (hash(x, y, seed + 5) > 0.975) col = [92, 52, 35];
        const pb = pebbles.get(y * w + x);
        if (pb && pb[0] > 0.7) col = pb[1] > 0 ? [190, 140, 100] : [120, 76, 52];
      } else {
        // roca: bloques irregulares con grietas y brillos
        const ox = Math.floor(vnoise(x, y, 6, seed) * 5);
        const oy = Math.floor(vnoise(y, x, 6, seed) * 4);
        const bx = Math.floor((x + ox) / 9);
        const by = Math.floor((y + oy) / 7);
        const edge = (x + ox) % 9 === 0 || (y + oy) % 7 === 0;
        col = edge ? pal[3] : pal[Math.floor(hash(bx, by, seed) * 3)];
        if (!edge && (y + oy) % 7 === 1) col = col.map((v) => v + 14);
        if (!edge && hash(x, y, seed + 8) > 0.96) col = [134, 133, 140];
      }
      // humus y raíces en el primer nivel
      if (r0 === 1 && y < 5) col = y < 2 ? [52, 36, 24] : y < 4 ? [64, 46, 30] : col;
      if (r0 === 1 && y < 24 && hash(x, 0, seed + 9) > 0.94) {
        const sway = Math.round(Math.sin(y / 3 + x) * 1);
        if (sway === 0 && hash(x, y >> 2, seed) > 0.3) col = [128, 94, 58];
      }
      const i = (y * w + x) * 4;
      d[i] = col[0] * depthF;
      d[i + 1] = col[1] * depthF;
      d[i + 2] = col[2] * depthF;
      d[i + 3] = 255;
    }
  }
  return img;
}

// ─── Salas ───────────────────────────────────────────────────────────────────
function isDug(b: Bunker, c: number, r: number) {
  return c >= 0 && c < b.cols && r >= 1 && r < b.rows && b.cells[idx(b, c, r)] === 'hueco';
}

function ladder(c: Ctx, x: number, y0: number, y1: number) {
  vline(c, x, y0, y1 - y0, C.met2);
  vline(c, x + 4, y0, y1 - y0, C.met2);
  for (let y = y0 + 2; y < y1; y += 3) hline(c, x + 1, y, 3, C.met3);
}

function drawRoomShell(c: Ctx, b: Bunker, col: number, r: number) {
  const x = col * CW;
  const y = SKY + (r - 1) * CH;
  // pared del fondo: paneles de hormigón
  rect(c, x, y, CW, CH, C.con2);
  for (let k = 1; k < 4; k++) vline(c, x + k * 10, y + 2, 25, C.con1);
  hline(c, x, y + 14, CW, C.con1);
  for (let k = 0; k < 4; k++) {
    px(c, x + k * 10 + 2, y + 4, C.con4);
    px(c, x + k * 10 + 2, y + 16, C.con4);
  }
  for (let yy = y + 2; yy < y + 27; yy++) for (let xx = x; xx < x + CW; xx++) if (hash(xx, yy, 21) > 0.93) px(c, xx, yy, C.con3);
  // sombra bajo el techo
  hline(c, x, y + 2, CW, C.con1);
  for (let xx = x; xx < x + CW; xx++) if (bayer(xx, y + 3, 0.5)) px(c, xx, y + 3, C.con1);
  // techo y suelo
  hline(c, x, y, CW, C.con0);
  hline(c, x, y + 1, CW, C.con3);
  hline(c, x, y + 27, CW, C.con4);
  hline(c, x, y + 28, CW, C.con3);
  hline(c, x, y + 29, CW, C.con1);
  // tubería por el techo
  hline(c, x, y + 4, CW, C.met2);
  hline(c, x, y + 5, CW, C.met1);
  px(c, x + 13, y + 4, C.met3);
  px(c, x + 33, y + 4, C.met3);
  // muros laterales o puertas
  for (const side of [-1, 1] as const) {
    const wx = side < 0 ? x : x + CW - 2;
    if (isDug(b, col + side, r)) {
      // dintel sobre el paso
      rect(c, wx, y + 2, 2, 6, C.con3);
      hline(c, wx, y + 7, 2, C.con1);
    } else {
      rect(c, wx, y, 2, CH, side < 0 ? C.con3 : C.con1);
      vline(c, side < 0 ? wx + 1 : wx, y, CH, side < 0 ? C.con4 : C.con0);
    }
  }
  // escotillas y escaleras entre niveles
  const above = isDug(b, col, r - 1) || (r === 1 && col === b.entryCol);
  const below = isDug(b, col, r + 1);
  if (above) {
    rect(c, x + 3, y, 7, 2, C.ink);
    ladder(c, x + 4, y, y + 27);
  }
  if (below) {
    rect(c, x + 3, y + 27, 7, 3, C.ink);
    hline(c, x + 3, y + 27, 7, C.hazard);
  }
}

function lampOf(c: Ctx, x: number, y: number, lit: boolean, flicker: boolean) {
  rect(c, x + 19, y + 2, 3, 2, C.con0);
  rect(c, x + 18, y + 4, 5, 2, lit ? (flicker ? C.amb2 : C.amb3) : C.con1);
  if (lit) hline(c, x + 19, y + 5, 3, C.amb4);
}

// ─── Renderizador ────────────────────────────────────────────────────────────
export interface FrameInput {
  s: GameState;
  t: number;
  buildMode: boolean;
  sel: { c: number; r: number } | null;
  reduced: boolean;
}

export class BunkerRenderer {
  private low: HTMLCanvasElement;
  private lc: Ctx;
  private terrainKey = '';
  private terrain: HTMLCanvasElement | null = null;
  w = 0;
  h = 0;

  constructor() {
    this.low = makeCanvas(1, 1);
    this.lc = ctx2d(this.low);
  }

  private ensureTerrain(b: Bunker, seed: number) {
    const key = `${b.cells.join('')}|${seed}`;
    if (key === this.terrainKey && this.terrain) return;
    const { w, h } = sceneSize(b);
    const cv = makeCanvas(w, h - SKY);
    ctx2d(cv).putImageData(terrainImage(b, seed), 0, 0);
    this.terrain = cv;
    this.terrainKey = key;
  }

  /** Dibuja la escena a baja resolución y la vuelca escalada en `out`. */
  render(out: HTMLCanvasElement, input: FrameInput) {
    const { s, t, reduced } = input;
    const b = s.bunker;
    const { w, h } = sceneSize(b);
    if (this.low.width !== w || this.low.height !== h) {
      this.low.width = w;
      this.low.height = h;
      this.lc = ctx2d(this.low);
    }
    this.w = w;
    this.h = h;
    const c = this.lc;
    const look = lookFor(s);
    const night = look.tod === 'night';
    const hour = clockHour(s);
    const sleeping = s.stage !== 'prep' && s.stage !== 'briefing' && (hour >= 23 || hour < 7);
    const powered = gridUp(s) || s.batteryWh > 1 || b.genRunning;
    const lightsOn = s.plan.lights && (powered || ((s.inv.linterna ?? 0) > 0 && (s.inv.pilas ?? 0) > 0));
    const lit = lightsOn && !sleeping;
    const flicker = !reduced && !powered && lit && hash(Math.floor(t / 120), 1) > 0.85;

    // Cielo, ciudad, suelo
    drawSky(c, w, look, t, reduced);
    drawSkyline(c, w, look, t, reduced);
    drawGround(c, w, look, t);

    // Atrezo exterior
    const gy = SKY - 6;
    const leftFree = b.entryCol - 2 >= 0 ? (b.entryCol - 2) * CW + 20 : -100;
    if (leftFree > 0) tree(c, leftFree, gy, look.key === 'nuclear' && look.after ? 'dead' : look.key === 'frio' && look.after ? 'snowy' : 'leafy');
    const rightCol = b.entryCol + 2;
    if (rightCol < b.cols) car(c, rightCol * CW + 8, gy, look.key === 'colapso' && look.after ? C.con3 : C.red2, look.key === 'colapso' && look.after ? C.con4 : C.red3, C.red1, look.after);
    // valla
    for (let x = 2; x < w; x += 6) if (!underHouse(b, Math.floor(x / CW)) && Math.floor(x / CW) !== rightCol) {
      vline(c, x, gy - 6, 6, C.wod1);
      px(c, x, gy - 7, C.wod2);
    }
    for (let x = 0; x < w; x++) if (!underHouse(b, Math.floor(x / CW)) && Math.floor(x / CW) !== rightCol) {
      px(c, x, gy - 5, C.wod2);
      px(c, x, gy - 3, C.wod1);
    }
    // casa
    const hx = (b.entryCol - 1) * CW + 6;
    const hw = 3 * CW - 12;
    house(c, hx, gy, hw, {
      night: night || look.tod === 'dusk',
      lightsInside: !look.after && !look.blackout,
      boarded: look.after && (look.key === 'colapso' || look.key === 'tormenta_solar'),
      snow: look.key === 'frio' && look.after,
      ash: look.key === 'nuclear' && look.after,
    });
    // sacos terreros
    b.coverCm.forEach((cm, col) => {
      const layers = Math.round((cm ?? 0) / 10);
      if (!layers) return;
      if (underHouse(b, col)) sandbags(c, col * CW + 4, gy, CW - 8, Math.min(layers, 4), false);
      else sandbags(c, col * CW + 2, gy, CW - 4, layers, true);
    });

    // Terreno
    this.ensureTerrain(b, look.seed);
    c.drawImage(this.terrain!, 0, SKY);

    // Salas
    const shelter = shelterCell(b);
    const cap = batteryCapacityWh(b);
    const proj = b.project;
    for (let r = 1; r < b.rows; r++)
      for (let col = 0; col < b.cols; col++) {
        if (!isDug(b, col, r)) continue;
        const x = col * CW;
        const y = SKY + (r - 1) * CH;
        drawRoomShell(c, b, col, r);
        lampOf(c, x, y, lit, flicker);
        const m = moduleAt(b, col, r);
        const st: SpriteState = { t: reduced ? 0 : t, on: false, broken: !!m?.broken, level: 0, lit };
        if (m) {
          st.on =
            m.type === 'generador'
              ? b.genRunning
              : m.type === 'ventilacion'
                ? s.plan.fan && powered
                : m.type === 'hidroponico' || m.type === 'radio'
                  ? powered
                  : m.type === 'esclusa'
                    ? Math.floor(t / 6000) % 4 === 0
                    : lit;
          st.level = m.type === 'baterias' ? (cap > 0 ? s.batteryWh / cap : 0) : m.type === 'deposito_agua' ? Math.min(1, (s.inv.agua ?? 0) / 500) : m.type === 'hidroponico' ? (m.growth ?? 0) / 21 : 0;
          moduleSprite(c, m.type, x, y + 27, st);
        }
        // obra de construcción en curso
        if (proj && proj.kind === 'construir' && proj.c === col && proj.r === r) scaffold(c, x, y, 1 - proj.hoursLeft / proj.hoursTotal, t);
        // superviviente
        if (shelter.c === col && shelter.r === r && s.stage !== 'briefing') {
          survivor(c, m ? x + 4 : x + 16, y + 27, {
            sleeping,
            sick: s.survivor.infection?.stage === 'activa',
            hurt: s.survivor.injuries > 25,
            t: reduced ? 0 : t,
          });
        }
        // oscuridad si no hay luz
        if (!lit) {
          c.fillStyle = sleeping ? 'rgba(4,6,14,0.5)' : 'rgba(4,6,14,0.55)';
          c.fillRect(x, y, CW, CH);
        }
      }
    // excavación en curso
    if (proj && proj.kind === 'excavar') digging(c, b, proj.c, proj.r, 1 - proj.hoursLeft / proj.hoursTotal, t);
    if (proj && proj.kind === 'cubrir') {
      const x = proj.c * CW;
      progressBar(c, x + 8, gy - 16, CW - 16, 1 - proj.hoursLeft / proj.hoursTotal);
    }

    // Clima
    weather(c, w, look, t, reduced);

    // Selección y modo obra
    if (input.buildMode && !proj)
      for (let r = 1; r < b.rows; r++)
        for (let col = 0; col < b.cols; col++) if (canDig(b, col, r)) ants(c, col * CW, SKY + (r - 1) * CH, reduced ? 0 : t);
    if (input.sel && input.sel.r >= 1) brackets(c, input.sel.c * CW, SKY + (input.sel.r - 1) * CH, reduced ? 0 : t);

    // Escalado sin suavizado + pasada de luz
    const oc = out.getContext('2d')!;
    oc.imageSmoothingEnabled = false;
    oc.clearRect(0, 0, out.width, out.height);
    oc.drawImage(this.low, 0, 0, out.width, out.height);
    const k = out.width / w;
    oc.globalCompositeOperation = 'lighter';
    for (let r = 1; r < b.rows; r++)
      for (let col = 0; col < b.cols; col++) {
        if (!isDug(b, col, r)) continue;
        const cx = (col * CW + 20.5) * k;
        const cy = (SKY + (r - 1) * CH + 6) * k;
        const m = moduleAt(b, col, r);
        if (lit) glow(oc, cx, cy + 6 * k, 30 * k, flicker ? 'rgba(255,170,80,0.14)' : 'rgba(255,176,86,0.26)');
        if (m && !m.broken) {
          const mx = (col * CW + 25) * k;
          const my = (SKY + (r - 1) * CH + 14) * k;
          if (m.type === 'hidroponico' && powered) glow(oc, mx, my, 22 * k, 'rgba(210,90,220,0.22)');
          if (m.type === 'radio' && powered) glow(oc, (col * CW + 17) * k, (SKY + (r - 1) * CH + 13) * k, 8 * k, 'rgba(120,255,140,0.25)');
          if (m.type === 'generador' && b.genRunning) glow(oc, (col * CW + 28) * k, (SKY + (r - 1) * CH + 18) * k, 10 * k, 'rgba(120,255,120,0.12)');
        }
        if (m?.broken && Math.floor(t / 600) % 2 === 0) glow(oc, (col * CW + 36) * k, (SKY + (r - 1) * CH + 2) * k, 12 * k, 'rgba(255,60,40,0.35)');
      }
    if (night && !look.after) {
      // ventanas de la casa encendidas
      glow(oc, (hx + 15) * k, (gy - 19) * k, 14 * k, 'rgba(255,190,90,0.18)');
      glow(oc, (hx + hw - 19) * k, (gy - 19) * k, 14 * k, 'rgba(255,190,90,0.18)');
    }
    if (look.key === 'inundacion' && !reduced && hash(Math.floor(t / 150), 77) > 0.985) {
      oc.fillStyle = 'rgba(220,230,255,0.35)';
      oc.fillRect(0, 0, out.width, (SKY - 6) * k);
    }
    oc.globalCompositeOperation = 'source-over';
    // viñeta suave
    const vg = oc.createRadialGradient(out.width / 2, out.height / 2, out.height * 0.35, out.width / 2, out.height / 2, out.height * 0.85);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.35)');
    oc.fillStyle = vg;
    oc.fillRect(0, 0, out.width, out.height);
  }
}

export function glow(c: CanvasRenderingContext2D, x: number, y: number, r: number, col: string) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, col);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g;
  c.fillRect(x - r, y - r, r * 2, r * 2);
}

function progressBar(c: Ctx, x: number, y: number, w: number, p: number) {
  rect(c, x - 1, y - 1, w + 2, 4, C.ink);
  rect(c, x, y, w, 2, C.con1);
  rect(c, x, y, Math.round(w * Math.max(0, Math.min(1, p))), 2, C.amb3);
}

function scaffold(c: Ctx, x: number, y: number, p: number, t: number) {
  for (const sx of [x + 8, x + 30]) vline(c, sx, y + 6, 21, C.wod2);
  hline(c, x + 8, y + 12, 23, C.wod2);
  hline(c, x + 8, y + 20, 23, C.wod2);
  for (let k = 0; k < 23; k++) if (Math.floor((k + t / 200) / 2) % 2) px(c, x + 8 + k, y + 16, C.hazard);
  progressBar(c, x + 6, y + 8, CW - 12, p);
}

function digging(c: Ctx, b: Bunker, col: number, r: number, p: number, t: number) {
  const x = col * CW;
  const y = SKY + (r - 1) * CH;
  // lado desde el que se excava
  const fromLeft = isDug(b, col - 1, r);
  const fromRight = isDug(b, col + 1, r);
  const fromTop = isDug(b, col, r - 1);
  const cut = Math.max(2, Math.round(p * (fromTop && !fromLeft && !fromRight ? CH : CW)));
  c.fillStyle = '#1f150e';
  if (fromLeft) c.fillRect(x, y + 4, cut, CH - 6);
  else if (fromRight) c.fillRect(x + CW - cut, y + 4, cut, CH - 6);
  else c.fillRect(x + 6, y, CW - 12, cut);
  // puntales de madera
  const px0 = fromLeft ? x + cut - 2 : fromRight ? x + CW - cut : x + 8;
  if (fromLeft || fromRight) {
    vline(c, px0, y + 4, CH - 6, C.wod2);
    hline(c, Math.min(px0, fromLeft ? x : px0), y + 4, cut, C.wod1);
  }
  // pico animado
  const f = Math.floor(t / 250) % 2;
  const ax = fromLeft ? x + cut - 6 : fromRight ? x + CW - cut + 2 : x + 18;
  const ay = fromTop && !fromLeft && !fromRight ? y + cut - 6 : y + 18;
  vline(c, ax + 2, ay - 3 + f, 5, C.wod2);
  hline(c, ax, ay - 3 + f, 5, C.met4);
  // montón de tierra
  for (let k = 0; k < 6; k++) hline(c, x + 2 + k, y + 27 - k / 2, 12 - k * 2, '#6e4e38');
  progressBar(c, x + 6, y + 2, CW - 12, p);
}

export function weather(c: Ctx, W: number, look: Look, t: number, reduced: boolean) {
  if (reduced) return;
  const H = SKY - 6;
  const type = look.key === 'nuclear' ? 'ash' : look.key === 'frio' ? 'snow' : look.key === 'inundacion' ? 'rain' : look.key === 'colapso' ? 'dust' : null;
  if (!type || !look.after) return;
  const n = type === 'rain' ? 90 : type === 'snow' ? 70 : type === 'ash' ? 55 : 18;
  for (let k = 0; k < n; k++) {
    const sp = type === 'rain' ? 0.12 : type === 'snow' ? 0.012 : type === 'ash' ? 0.008 : 0.004;
    const drift = type === 'rain' ? -0.04 : Math.sin(t / 900 + k) * 0.6;
    const y = Math.floor((hash(k, 1, 3) * H + t * sp * (0.7 + hash(k, 2) * 0.6)) % H);
    const x = Math.floor((hash(k, 3, 3) * W + drift * (type === 'rain' ? t : 1) + 2 * W) % W);
    if (type === 'rain') {
      px(c, x, y, C.blu4);
      px(c, x - 1, y + 1, C.blu3);
      px(c, x - 1, y + 2, C.blu3);
    } else if (type === 'snow') {
      px(c, x, y, C.bon2);
      if (hash(k, 9) > 0.7) px(c, x + 1, y, C.bon1);
    } else if (type === 'ash') px(c, x, y, hash(k, 4) > 0.5 ? '#b4a99a' : '#7f766a');
    else px(c, x, y, '#9a8670');
  }
}

function ants(c: Ctx, x: number, y: number, t: number) {
  const off = Math.floor(t / 120);
  const per = 2 * (CW + CH);
  for (let i = 0; i < per; i++) {
    if (((i + off) % 6) >= 3) continue;
    let xx: number;
    let yy: number;
    if (i < CW) [xx, yy] = [x + i, y];
    else if (i < CW + CH) [xx, yy] = [x + CW - 1, y + i - CW];
    else if (i < 2 * CW + CH) [xx, yy] = [x + CW - 1 - (i - CW - CH), y + CH - 1];
    else [xx, yy] = [x, y + CH - 1 - (i - 2 * CW - CH)];
    px(c, xx, yy, C.amb3);
  }
}

function brackets(c: Ctx, x: number, y: number, t: number) {
  const o = Math.floor(t / 300) % 2;
  const col = C.bon2;
  const L = 6;
  for (const [cx, cy, dx, dy] of [
    [x - o, y - o, 1, 1],
    [x + CW - 1 + o, y - o, -1, 1],
    [x - o, y + CH - 1 + o, 1, -1],
    [x + CW - 1 + o, y + CH - 1 + o, -1, -1],
  ] as const) {
    hline(c, dx > 0 ? cx : cx - L + 1, cy, L, col);
    vline(c, cx, dy > 0 ? cy : cy - L + 1, L, col);
  }
}
