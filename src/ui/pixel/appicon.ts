/** Icono de la app en pixel art (32×32): casa, aurora y el búnker iluminado bajo tierra. */
import { C, bayer, disc, hash, hline, px, rect, vline, type Ctx } from './gfx';

export function drawAppIcon(c: Ctx) {
  const sky = ['#05101f', '#0a1a30', '#132a44'];
  for (let y = 0; y < 13; y++) for (let x = 0; x < 32; x++) px(c, x, y, bayer(x, y, (y % 5) / 5) ? sky[Math.min(2, Math.floor(y / 5) + 1)] : sky[Math.floor(y / 5)]);
  for (let x = 0; x < 32; x++) {
    const y = 3 + Math.round(Math.sin(x / 5) * 1.5);
    px(c, x, y, '#3fe08a');
    if (x % 2) px(c, x, y + 1, '#2a9a5e');
  }
  for (let k = 0; k < 7; k++) px(c, Math.floor(hash(k, 1) * 32), 6 + Math.floor(hash(k, 2) * 5), '#dfe8ff');
  // casa
  for (let j = 0; j < 4; j++) hline(c, 10 - j, 6 + j, 12 + j * 2, j === 0 ? C.red2 : C.red1);
  rect(c, 9, 10, 14, 4, '#cbbd9d');
  rect(c, 15, 11, 2, 3, C.wod1);
  px(c, 11, 11, C.amb3);
  px(c, 20, 11, C.amb3);
  // suelo
  hline(c, 0, 13, 32, C.grn3);
  hline(c, 0, 14, 32, C.grn2);
  for (let y = 15; y < 32; y++) for (let x = 0; x < 32; x++) px(c, x, y, hash(x, y, 4) > 0.8 ? '#6e4e38' : y > 26 ? '#4b3b30' : '#5c4030');
  // búnker
  rect(c, 6, 17, 20, 11, C.ink);
  rect(c, 7, 18, 18, 9, C.con2);
  hline(c, 7, 26, 18, C.con4);
  vline(c, 7, 18, 9, C.con3);
  rect(c, 15, 18, 3, 1, C.amb3);
  for (let y = 19; y < 27; y++) for (let x = 8; x < 24; x++) {
    const d = Math.hypot(x - 16, y - 19);
    if (d < 7 && bayer(x, y, 0.55 - d / 14)) px(c, x, y, '#8a6a3a');
  }
  // escalera
  vline(c, 9, 14, 13, C.met3);
  vline(c, 11, 14, 13, C.met3);
  for (let y = 16; y < 27; y += 2) px(c, 10, y, C.met4);
  // superviviente
  rect(c, 17, 20, 3, 1, C.red2);
  rect(c, 17, 21, 3, 2, C.skn1);
  rect(c, 17, 23, 3, 2, C.olv1);
  px(c, 17, 25, C.ink2);
  px(c, 19, 25, C.ink2);
  // generador
  rect(c, 21, 23, 3, 3, C.amb2);
  px(c, 22, 24, C.ink);
  disc(c, 0, 0, 0, C.ink);
}
