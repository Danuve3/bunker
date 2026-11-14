/** Vista pixel art del búnker (Canvas) con rejilla accesible de celdas encima. */
import { useEffect, useRef } from 'preact/hooks';
import { canDig, idx, moduleAt } from '../../core/bunker';
import type { GameState } from '../../core/types';
import { C, moduleName } from '../../i18n';
import { selectedCell } from '../store';
import { BunkerRenderer, CH, CW, SKY, sceneSize } from '../pixel/scene';

const reducedMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function BunkerView({ s, buildMode = false, interactive = true }: { s: GameState; buildMode?: boolean; interactive?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<BunkerRenderer>();
  const state = useRef({ s, buildMode, interactive });
  state.current = { s, buildMode, interactive };
  const { w, h } = sceneSize(s.bunker);

  useEffect(() => {
    const cv = ref.current!;
    renderer.current ??= new BunkerRenderer();
    const reduced = reducedMotion();
    let raf = 0;
    let last = 0;
    const size = () => {
      const dpr = Math.min(3, devicePixelRatio || 1);
      const cw = Math.max(1, Math.round(cv.clientWidth * dpr));
      const ch = Math.round((cw * h) / w);
      if (cv.width !== cw || cv.height !== ch) {
        cv.width = cw;
        cv.height = ch;
      }
    };
    const draw = (t: number) => {
      size();
      renderer.current!.render(cv, { s: state.current.s, buildMode: state.current.buildMode, sel: state.current.interactive ? selectedCell.value : null, t, reduced });
    };
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (t - last < 66) return; // ~15 fps: suficiente para pixel art
      last = t;
      draw(t);
    };
    const ro = new ResizeObserver(() => draw(performance.now()));
    ro.observe(cv);
    const vis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && !reduced) raf = requestAnimationFrame(loop);
    };
    document.addEventListener('visibilitychange', vis);
    if (reduced) draw(0);
    else raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener('visibilitychange', vis);
    };
  }, [w, h]);

  // Con movimiento reducido, redibuja al cambiar el estado.
  useEffect(() => {
    if (ref.current && renderer.current && reducedMotion())
      renderer.current.render(ref.current, { s, buildMode, sel: interactive ? selectedCell.value : null, t: 0, reduced: true });
  }, [s, buildMode, selectedCell.value]);

  const b = s.bunker;
  const sel = selectedCell.value;
  const cells = [];
  for (let r = 1; r < b.rows; r++)
    for (let c = 0; c < b.cols; c++) {
      const k = b.cells[idx(b, c, r)];
      const m = moduleAt(b, c, r);
      const focusable = k === 'hueco' || (buildMode && canDig(b, c, r));
      cells.push(
        <button
          key={`${c}-${r}`}
          class="cell-hit"
          tabIndex={focusable ? 0 : -1}
          aria-label={`Nivel −${r}, columna ${c + 1}: ${m ? moduleName(m.type) : C.cells[k]}`}
          aria-pressed={!!sel && sel.c === c && sel.r === r}
          style={{
            left: `${((c * CW) / w) * 100}%`,
            top: `${((SKY + (r - 1) * CH) / h) * 100}%`,
            width: `${(CW / w) * 100}%`,
            height: `${(CH / h) * 100}%`,
          }}
          onClick={() => (selectedCell.value = sel && sel.c === c && sel.r === r ? null : { c, r })}
        />,
      );
    }

  return (
    <div class="bunker-wrap" style={{ aspectRatio: `${w} / ${h}` }}>
      <canvas ref={ref} class="bunker-canvas" role="img" aria-label="Corte lateral del búnker" />
      {interactive && <div class="cell-grid">{cells}</div>}
    </div>
  );
}
