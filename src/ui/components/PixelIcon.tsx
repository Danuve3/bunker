import { iconUrl } from '../pixel/icons';

/** Icono pixel art escalado sin suavizado. `size` en px CSS (múltiplos de 16 se ven más nítidos). */
export function PixelIcon({ name, size = 24, label }: { name: string; size?: number; label?: string }) {
  return (
    <img
      class="pxicon"
      src={iconUrl(name)}
      width={size}
      height={size}
      alt={label ?? ''}
      aria-hidden={label ? undefined : 'true'}
      draggable={false}
    />
  );
}
