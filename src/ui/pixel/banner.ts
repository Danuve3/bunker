/**
 * Viñetas pixel art para cartas y pantallas: exterior según la amenaza (crisis finales,
 * encuentros), interior del búnker (sucesos), victoria y muerte.
 */
import type { GameState, ModuleType } from '../../core/types';
import { C, ctx2d, hash, hline, makeCanvas, px, rect, vline, type Ctx } from './gfx';
import { drawGround, drawSky, drawSkyline, glow, lookFor, weather, SKY, type Look } from './scene';
import { moduleSprite, survivor } from './sprites';

export const BANNER_W = 192;
export const BANNER_H = SKY;
export type BannerKind = 'boss' | 'event' | 'encounter' | 'win' | 'death';

function figure(c: Ctx, x: number, fy: number, coat: string, t: number) {
  const bob = Math.floor(t / 300) % 2;
  rect(c, x + 1, fy - 4, 2, 4, C.ink2);
  rect(c, x + 4, fy - 4 + bob, 2, 4 - bob, C.ink2);
  rect(c, x, fy - 11, 7, 7, coat);
  rect(c, x + 1, fy - 15, 5, 4, C.ink2);
  rect(c, x + 1, fy - 16, 5, 2, C.ink);
}

function interior(c: Ctx, id: string, t: number) {
  const W = BANNER_W;
  rect(c, 0, 0, W, BANNER_H, C.con2);
  for (let x = 0; x < W; x += 12) vline(c, x, 4, BANNER_H - 14, C.con1);
  hline(c, 0, 34, W, C.con1);
  for (let y = 4; y < BANNER_H - 10; y++) for (let x = 0; x < W; x++) if (hash(x, y, 21) > 0.94) px(c, x, y, C.con3);
  rect(c, 0, 0, W, 3, C.con0);
  hline(c, 0, 6, W, C.met2);
  hline(c, 0, 7, W, C.met1);
  rect(c, 0, BANNER_H - 10, W, 10, C.con3);
  hline(c, 0, BANNER_H - 10, W, C.con4);
  const props: ModuleType[] = ['ocio', 'despensa', 'radio', 'taller', 'dormitorio', 'purificador', 'enfermeria', 'deposito_agua'];
  const h = Math.floor(hash(id.length, id.charCodeAt(3) || 1, 5) * props.length);
  const st = { t, on: true, broken: false, level: 0.6, lit: true };
  moduleSprite(c, props[h], 100, BANNER_H - 10, st);
  moduleSprite(c, props[(h + 3) % props.length], 18, BANNER_H - 10, st);
  rect(c, 92, 8, 7, 3, C.con0);
  rect(c, 91, 11, 9, 2, C.amb3);
  survivor(c, 70, BANNER_H - 10, { sleeping: false, sick: false, hurt: false, t });
}

export class BannerRenderer {
  private low = makeCanvas(BANNER_W, BANNER_H);
  private lc = ctx2d(this.low);

  render(out: HTMLCanvasElement, s: GameState, kind: BannerKind, id: string, t: number, reduced: boolean) {
    const c = this.lc;
    const look: Look = { ...lookFor(s), after: true };
    if (kind === 'event') interior(c, id, reduced ? 0 : t);
    else {
      if (kind === 'win') look.tod = 'dawn';
      drawSky(c, BANNER_W, look, reduced ? 0 : t, reduced);
      drawSkyline(c, BANNER_W, look, reduced ? 0 : t, reduced);
      drawGround(c, BANNER_W, look, reduced ? 0 : t);
      const gy = SKY - 6;
      if (kind === 'encounter') {
        survivor(c, 60, gy, { sleeping: false, sick: false, hurt: false, t: reduced ? 0 : t });
        figure(c, 110, gy, C.red1, reduced ? 0 : t);
        figure(c, 122, gy, C.blu1, reduced ? 0 : t + 150);
      } else if (kind === 'boss') {
        // escotilla del búnker en primer plano
        rect(c, 84, gy - 6, 24, 6, C.ink);
        rect(c, 85, gy - 5, 22, 5, C.con3);
        hline(c, 85, gy - 5, 22, C.con4);
        for (let x = 86; x < 106; x += 4) px(c, x, gy - 3, C.hazard);
      } else if (kind === 'win') {
        survivor(c, 92, gy, { sleeping: false, sick: false, hurt: false, t: reduced ? 0 : t });
      } else if (kind === 'death') {
        rect(c, 88, gy - 12, 3, 12, C.wod1);
        rect(c, 84, gy - 9, 11, 2, C.wod1);
      }
      weather(c, BANNER_W, look, reduced ? 0 : t, reduced);
    }
    const oc = out.getContext('2d')!;
    oc.imageSmoothingEnabled = false;
    oc.drawImage(this.low, 0, 0, out.width, out.height);
    if (kind === 'boss') {
      const pulse = reduced ? 0.25 : 0.18 + 0.12 * Math.sin(t / 300);
      oc.fillStyle = `rgba(200,30,20,${pulse})`;
      oc.fillRect(0, 0, out.width, out.height);
    }
    if (kind === 'death') {
      oc.fillStyle = 'rgba(40,0,0,0.35)';
      oc.fillRect(0, 0, out.width, out.height);
    }
    if (kind === 'event') {
      oc.globalCompositeOperation = 'lighter';
      const k = out.width / BANNER_W;
      glow(oc, 95.5 * k, 14 * k, 60 * k, 'rgba(255,176,86,0.28)');
      oc.globalCompositeOperation = 'source-over';
    }
    // scanlines suaves
    oc.fillStyle = 'rgba(0,0,0,0.12)';
    const step = Math.max(2, Math.round(out.height / BANNER_H) * 2);
    for (let y = 0; y < out.height; y += step) oc.fillRect(0, y, out.width, 1);
  }
}
