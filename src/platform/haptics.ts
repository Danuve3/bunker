/** Vibración háptica. Degrada sin errores donde no existe (iOS Safari). */
let enabled = true;
export const setHaptics = (on: boolean) => (enabled = on);
export const hapticsSupported = () => typeof navigator !== 'undefined' && 'vibrate' in navigator;

export const HAPTIC = {
  tap: 8,
  event: [30, 40, 30],
  boss: [80, 60, 160],
  alarm: [120, 80, 120, 80, 120],
  death: [400, 120, 600],
  win: [40, 40, 40, 40, 120],
} as const;

export function vibrate(pattern: number | readonly number[]) {
  if (!enabled || !hapticsSupported()) return;
  try {
    navigator.vibrate(pattern as number | number[]);
  } catch {
    /* algunos navegadores lo bloquean sin interacción */
  }
}
