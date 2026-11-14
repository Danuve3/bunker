/** Lienzo pixel art animado genérico (mapa, viñetas). Se pausa oculto y con movimiento reducido. */
import { useEffect, useRef } from 'preact/hooks';

const reducedMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function PixelCanvas({
  w,
  h,
  draw,
  class: cls = '',
  label,
  deps = [],
}: {
  w: number;
  h: number;
  draw: (cv: HTMLCanvasElement, t: number, reduced: boolean) => void;
  class?: string;
  label?: string;
  deps?: unknown[];
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;
  useEffect(() => {
    const cv = ref.current!;
    const reduced = reducedMotion();
    let raf = 0;
    let last = 0;
    const paint = (t: number) => {
      const dpr = Math.min(3, devicePixelRatio || 1);
      const cw = Math.max(1, Math.round(cv.clientWidth * dpr));
      const ch = Math.round((cw * h) / w);
      if (cv.width !== cw || cv.height !== ch) {
        cv.width = cw;
        cv.height = ch;
      }
      drawRef.current(cv, t, reduced);
    };
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (t - last < 80) return;
      last = t;
      paint(t);
    };
    const ro = new ResizeObserver(() => paint(performance.now()));
    ro.observe(cv);
    if (reduced) paint(0);
    else raf = requestAnimationFrame(loop);
    const vis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && !reduced) raf = requestAnimationFrame(loop);
    };
    document.addEventListener('visibilitychange', vis);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener('visibilitychange', vis);
    };
  }, [w, h]);
  useEffect(() => {
    if (ref.current && reducedMotion()) drawRef.current(ref.current, 0, true);
  }, deps);
  return <canvas ref={ref} class={`pxcanvas ${cls}`} style={{ aspectRatio: `${w} / ${h}` }} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : 'true'} />;
}
