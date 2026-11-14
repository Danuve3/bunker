/**
 * Script de balanceo: simula cientos de partidas con bots y resume estadísticas.
 * Uso: npm run balance -- [partidas=300] [bot=todos]
 */
import { newGame } from '../src/core/state';
import { score } from '../src/core/game';
import { totalKcal } from '../src/core/food';
import { playBot, type BotId } from './bot';

const N = Number(process.argv[2] ?? 300);
const only = process.argv[3] as BotId | undefined;
const BOTS: BotId[] = only ? [only] : ['pasivo', 'basico', 'constructor'];

for (const bot of BOTS) {
  const byThreat: Record<string, { n: number; phase: number; days: number; score: number; p1: number }> = {};
  const causes: Record<string, number> = {};
  const limiting: Record<string, number> = {};
  for (let i = 0; i < N; i++) {
    const s = playBot(newGame(`BAL-${i}`), bot, 120);
    const t = s.threat.variant ? `clima/${s.threat.variant}` : s.threat.primary;
    const e = (byThreat[t] ??= { n: 0, phase: 0, days: 0, score: 0, p1: 0 });
    e.n++;
    e.phase += s.phase;
    e.days += s.day;
    e.score += score(s);
    if (s.phase >= 2) e.p1++;
    const cause = s.deathCause ?? 'vivo';
    causes[cause] = (causes[cause] ?? 0) + 1;
    if (s.deathCause) {
      const lim = (s.inv.agua ?? 0) < 2 ? 'agua' : totalKcal(s) < 1000 ? 'comida' : 'otro';
      limiting[lim] = (limiting[lim] ?? 0) + 1;
    }
  }
  console.log(`\n══ Bot: ${bot} (${N} partidas) ══`);
  console.log('amenaza            n   fase media  días medios  % supera F1  puntos');
  for (const [t, e] of Object.entries(byThreat).sort()) {
    console.log(
      `${t.padEnd(18)} ${String(e.n).padStart(3)}   ${(e.phase / e.n).toFixed(2).padStart(9)}  ${(e.days / e.n).toFixed(1).padStart(10)}  ${((100 * e.p1) / e.n).toFixed(0).padStart(10)} %  ${(e.score / e.n).toFixed(0).padStart(6)}`,
    );
  }
  console.log('Causas de muerte:', Object.entries(causes).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${((100 * v) / N).toFixed(0)}%`).join(', '));
  console.log('Recurso agotado al morir:', JSON.stringify(limiting));
}
