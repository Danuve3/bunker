/**
 * PRNG determinista: sfc32 sembrado con cyrb128.
 * Nunca usar Math.random() en la lógica de juego: todo azar pasa por aquí
 * y el estado (4 enteros de 32 bits) se guarda con la partida.
 */

export type RngState = [number, number, number, number];

/** Hash de cadena → 4 enteros de 32 bits (cyrb128, dominio público). */
export function cyrb128(str: string): RngState {
  let h1 = 1779033703, h2 = 3144134277, h3 = 1013904242, h4 = 2773480762;
  for (let i = 0; i < str.length; i++) {
    const k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  h1 ^= h2 ^ h3 ^ h4; h2 ^= h1; h3 ^= h1; h4 ^= h1;
  return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}

export class Rng {
  private a: number; private b: number; private c: number; private d: number;

  constructor(state: RngState) {
    [this.a, this.b, this.c, this.d] = state;
  }

  static fromSeed(seed: string): Rng {
    const r = new Rng(cyrb128(seed));
    for (let i = 0; i < 12; i++) r.next(); // calentamiento
    return r;
  }

  state(): RngState {
    return [this.a >>> 0, this.b >>> 0, this.c >>> 0, this.d >>> 0];
  }

  /** Float uniforme en [0, 1). */
  next(): number {
    this.a >>>= 0; this.b >>>= 0; this.c >>>= 0; this.d >>>= 0;
    let t = (this.a + this.b) | 0;
    this.a = this.b ^ (this.b >>> 9);
    this.b = (this.c + (this.c << 3)) | 0;
    this.c = (this.c << 21) | (this.c >>> 11);
    this.d = (this.d + 1) | 0;
    t = (t + this.d) | 0;
    this.c = (this.c + t) | 0;
    return (t >>> 0) / 4294967296;
  }

  /** Float en [min, max). */
  range(min: number, max: number): number {
    return min + (max - min) * this.next();
  }

  /** Entero en [min, max] (ambos incluidos). */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  chance(p: number): boolean {
    return this.next() < p;
  }

  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  weighted<T>(items: readonly { item: T; w: number }[]): T {
    const total = items.reduce((s, i) => s + Math.max(0, i.w), 0);
    let r = this.next() * total;
    for (const it of items) {
      r -= Math.max(0, it.w);
      if (r < 0) return it.item;
    }
    return items[items.length - 1].item;
  }

  /** Mezcla Fisher-Yates (devuelve copia). */
  shuffle<T>(arr: readonly T[]): T[] {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /** Normal aproximada (Box-Muller). */
  normal(mean = 0, sd = 1): number {
    const u = 1 - this.next();
    const v = this.next();
    return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
}

/** Semilla aleatoria legible para partidas normales (único punto que usa entropía externa). */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function seedFromEntropy(entropy: number): string {
  let n = Math.floor(entropy) >>> 0;
  let s = '';
  for (let i = 0; i < 6; i++) {
    s += ALPHABET[n % ALPHABET.length];
    n = Math.floor(n / ALPHABET.length) ^ (i * 2654435761 >>> 0);
    n >>>= 0;
  }
  return s;
}

/** Semilla del "Búnker del día": derivada de la fecha UTC (AAAA-MM-DD). */
export function dailySeed(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `DIA-${y}${m}${d}`;
}
