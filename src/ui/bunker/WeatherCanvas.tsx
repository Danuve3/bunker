/**
 * Capa de partículas del clima (ceniza, nieve, lluvia, polvo) en Canvas sobre el cielo SVG.
 * Se detiene con prefers-reduced-motion y cuando la pestaña está oculta.
 */
import { useEffect, useRef } from 'preact/hooks';

export type WeatherKind = 'ash' | 'snow' | 'rain' | 'dust' | null;

interface P {
  x: number;
  y: number;
  v: number;
  s: number;
  d: number;
}

const CONF = {
  ash: { n: 70, speed: 0.25, drift: 0.35, color: 'rgba(214,204,188,', size: [1, 2.4] },
  snow: { n: 90, speed: 0.45, drift: 0.5, color: 'rgba(255,255,255,', size: [1.2, 3] },
  rain: { n: 120, speed: 5, drift: -0.8, color: 'rgba(170,196,214,', size: [1, 1] },
  dust: { n: 40, speed: 0.12, drift: 0.6, color: 'rgba(190,170,140,', size: [0.8, 1.8] },
} as const;

export function WeatherCanvas({ kind, heightPct }: { kind: WeatherKind; heightPct: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv || !kind) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const conf = CONF[kind];
    let w = 0;
    let h = 0;
    const dpr = Math.min(2, devicePixelRatio || 1);
    const resize = () => {
      w = cv.clientWidth;
      h = cv.clientHeight;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(cv);
    // Posiciones iniciales con una secuencia fija (la UI tampoco usa Math.random).
    let seed = 1234567;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const ps: P[] = Array.from({ length: conf.n }, () => ({
      x: rnd() * (w || 300),
      y: rnd() * (h || 100),
      v: conf.speed * (0.6 + rnd() * 0.8),
      s: conf.size[0] + rnd() * (conf.size[1] - conf.size[0]),
      d: rnd() * Math.PI * 2,
    }));
    let raf = 0;
    let t = 0;
    const step = () => {
      t += 1;
      ctx.clearRect(0, 0, w, h);
      for (const p of ps) {
        p.y += p.v;
        p.x += conf.drift * (kind === 'rain' ? 1 : Math.sin(t / 60 + p.d));
        if (p.y > h) {
          p.y = -4;
          p.x = rnd() * w;
        }
        if (p.x < -5) p.x = w + 5;
        if (p.x > w + 5) p.x = -5;
        if (kind === 'rain') {
          ctx.strokeStyle = `${conf.color}0.55)`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + conf.drift * 3, p.y + 9);
          ctx.stroke();
        } else {
          ctx.fillStyle = `${conf.color}${kind === 'ash' ? 0.75 : 0.85})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      raf = requestAnimationFrame(step);
    };
    const vis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(step);
    };
    document.addEventListener('visibilitychange', vis);
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener('visibilitychange', vis);
    };
  }, [kind]);
  if (!kind) return null;
  return <canvas ref={ref} class="weather" style={{ height: `${heightPct}%` }} aria-hidden="true" />;
}
