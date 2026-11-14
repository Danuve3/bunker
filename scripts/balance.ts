/**
 * Script de balanceo: simula cientos de partidas con varios bots (estrategias) y resume
 * fase media, supervivencia a la fase 1, causas de muerte y recursos limitantes.
 * Uso: npm run balance -- [partidas=300] [bot]
 */
import { newGame } from '../src/core/state';
import { score } from '../src/core/game';
import { edibleKcal } from '../src/core/food';
import { BOTS, playBot, type BotId } from './bot';

const N = Number(process.argv[2] ?? 300);
const only = process.argv[3] as BotId | undefined;
const bots: BotId[] = only ? [only] : BOTS;

interface Agg {
  n: number;
  phase: number;
  days: number;
  score: number;
  passF1: number;
  dose: number;
}
const pct = (a: number, n: number) => `${((100 * a) / Math.max(1, n)).toFixed(0)}%`;

const summary: Record<string, Record<string, number>> = {};

for (const bot of bots) {
  const byThreat: Record<string, Agg> = {};
  const causes: Record<string, number> = {};
  const limiting: Record<string, number> = {};
  const all: Agg = { n: 0, phase: 0, days: 0, score: 0, passF1: 0, dose: 0 };
  for (let i = 0; i < N; i++) {
    const s = playBot(newGame(`BAL-${i}`), bot, 150);
    const t = s.threat.variant ? `clima/${s.threat.variant}` : s.threat.primary;
    for (const e of [(byThreat[t] ??= { n: 0, phase: 0, days: 0, score: 0, passF1: 0, dose: 0 }), all]) {
      e.n++;
      e.phase += s.phase;
      e.days += s.day;
      e.score += score(s);
      e.dose += s.survivor.doseMSv;
      if (s.phase >= 2) e.passF1++;
    }
    const cause = s.deathCause ?? 'vivo';
    causes[cause] = (causes[cause] ?? 0) + 1;
    if (s.deathCause) {
      const lim = (s.inv.agua ?? 0) < 2 ? 'agua' : edibleKcal(s) < 1000 ? 'comida' : 'ninguno';
      limiting[lim] = (limiting[lim] ?? 0) + 1;
    }
  }
  summary[bot] = { fase: all.phase / all.n, dias: all.days / all.n, f1: (100 * all.passF1) / all.n, pts: all.score / all.n };
  console.log(`\n══ Bot: ${bot} (${N} partidas) ══`);
  console.log('amenaza              n  fase  días  supera F1  puntos  dosis mSv');
  for (const [t, e] of Object.entries(byThreat).sort()) {
    console.log(
      `${t.padEnd(20)} ${String(e.n).padStart(3)}  ${(e.phase / e.n).toFixed(1).padStart(4)}  ${(e.days / e.n).toFixed(1).padStart(4)}  ${pct(e.passF1, e.n).padStart(9)}  ${(e.score / e.n).toFixed(0).padStart(6)}  ${(e.dose / e.n).toFixed(0).padStart(9)}`,
    );
  }
  console.log('Causas de muerte:', Object.entries(causes).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${pct(v, N)}`).join(', '));
  console.log('Recurso agotado al morir:', Object.entries(limiting).map(([k, v]) => `${k} ${pct(v, N)}`).join(', '));
}

console.log('\n══ Resumen por estrategia ══');
console.log('bot            fase   días  supera F1  puntos');
for (const [b, v] of Object.entries(summary))
  console.log(`${b.padEnd(13)} ${v.fase.toFixed(2).padStart(5)}  ${v.dias.toFixed(1).padStart(5)}  ${v.f1.toFixed(0).padStart(8)} %  ${v.pts.toFixed(0).padStart(6)}`);
