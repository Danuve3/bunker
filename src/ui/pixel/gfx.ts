/**
 * Utilidades de dibujo pixel art: paleta propia, primitivas a píxel entero, ruido
 * determinista (sin Math.random) y tramado ordenado (Bayer) para degradados.
 */
export type Ctx = CanvasRenderingContext2D;

/** Paleta BÚNKER: tierra, hormigón, ámbar y cielos. */
export const C = {
  ink: '#120e0b',
  ink2: '#1c1611',
  // hormigón
  con0: '#2c2d30',
  con1: '#3a3c40',
  con2: '#4a4d52',
  con3: '#5d6167',
  con4: '#777c82',
  con5: '#979ca1',
  // metal
  met0: '#232b31',
  met1: '#33404a',
  met2: '#4a5a66',
  met3: '#6c7f8c',
  met4: '#9fb1bc',
  // madera
  wod0: '#3d2817',
  wod1: '#5a3c23',
  wod2: '#7a5432',
  wod3: '#a07046',
  // cálidos
  amb0: '#7a3f12',
  amb1: '#b8641c',
  amb2: '#e6942e',
  amb3: '#ffc25a',
  amb4: '#ffe7a3',
  // rojos
  red0: '#5a1814',
  red1: '#8e2f25',
  red2: '#c8473a',
  red3: '#ef7462',
  // verdes
  grn0: '#1e3318',
  grn1: '#2f4f22',
  grn2: '#4a7a30',
  grn3: '#74a845',
  grn4: '#a8d46a',
  // azules
  blu0: '#0f2236',
  blu1: '#1c3d5c',
  blu2: '#2e6390',
  blu3: '#4a93c2',
  blu4: '#8fd0ee',
  // piel y ropa
  skn0: '#9c6844',
  skn1: '#d39a6a',
  skn2: '#f0c294',
  olv0: '#2e3519',
  olv1: '#4a5528',
  olv2: '#6b7a3a',
  // blancos y crema
  bon0: '#a59a85',
  bon1: '#d6ccb4',
  bon2: '#f4ecd8',
  pnk: '#d77bba',
  pur: '#8a4fd1',
  yel: '#f2d14e',
  hazard: '#f2c22e',
} as const;

export const rect = (c: Ctx, x: number, y: number, w: number, h: number, col: string) => {
  c.fillStyle = col;
  c.fillRect(x | 0, y | 0, w | 0, h | 0);
};
export const px = (c: Ctx, x: number, y: number, col: string) => rect(c, x, y, 1, 1, col);
export const hline = (c: Ctx, x: number, y: number, w: number, col: string) => rect(c, x, y, w, 1, col);
export const vline = (c: Ctx, x: number, y: number, h: number, col: string) => rect(c, x, y, 1, h, col);

/** Caja con borde oscuro, relleno, luz arriba-izquierda y sombra abajo-derecha. */
export function box(c: Ctx, x: number, y: number, w: number, h: number, fill: string, hi: string, lo: string, outline: string | null = C.ink) {
  if (outline) rect(c, x - 1, y - 1, w + 2, h + 2, outline);
  rect(c, x, y, w, h, fill);
  hline(c, x, y, w, hi);
  vline(c, x, y, h, hi);
  hline(c, x, y + h - 1, w, lo);
  vline(c, x + w - 1, y, h, lo);
}

/** Círculo relleno a píxel. */
export function disc(c: Ctx, cx: number, cy: number, r: number, col: string) {
  c.fillStyle = col;
  for (let y = -r; y <= r; y++) {
    const w = Math.floor(Math.sqrt(r * r - y * y + r * 0.6));
    c.fillRect(cx - w, cy + y, w * 2 + 1, 1);
  }
}

/** Hash entero → [0,1). Determinista y estable entre fotogramas. */
export function hash(x: number, y: number, seed = 0): number {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Ruido de valor suavizado (para texturas orgánicas). */
export function vnoise(x: number, y: number, scale: number, seed = 0): number {
  const gx = x / scale;
  const gy = y / scale;
  const x0 = Math.floor(gx);
  const y0 = Math.floor(gy);
  const fx = gx - x0;
  const fy = gy - y0;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = hash(x0, y0, seed);
  const b = hash(x0 + 1, y0, seed);
  const c = hash(x0, y0 + 1, seed);
  const d = hash(x0 + 1, y0 + 1, seed);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
/** ¿Este píxel usa el color "siguiente" en un tramado de intensidad t (0..1)? */
export const bayer = (x: number, y: number, t: number) => BAYER[(y & 3) * 4 + (x & 3)] / 16 < t;

/** Degradado vertical por bandas con tramado entre colores. */
export function ditherGradient(c: Ctx, x: number, y: number, w: number, h: number, cols: string[]) {
  const n = cols.length - 1;
  for (let j = 0; j < h; j++) {
    const f = (j / Math.max(1, h - 1)) * n;
    const i = Math.min(n - 1, Math.floor(f));
    const t = f - i;
    for (let k = 0; k < w; k++) px(c, x + k, y + j, bayer(x + k, y + j, t) ? cols[i + 1] : cols[i]);
  }
}

export function hexToRgb(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function shade(h: string, f: number): string {
  const [r, g, b] = hexToRgb(h);
  const k = (v: number) => Math.max(0, Math.min(255, Math.round(v * f)));
  return `rgb(${k(r)},${k(g)},${k(b)})`;
}

export function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  return cv;
}

export function ctx2d(cv: HTMLCanvasElement | OffscreenCanvas): Ctx {
  const c = cv.getContext('2d') as Ctx;
  c.imageSmoothingEnabled = false;
  return c;
}
