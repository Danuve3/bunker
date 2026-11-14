/** Registro del Service Worker, aviso de nueva versión e instalación. */
import { signal } from '@preact/signals';

export const updateReady = signal(false);
export const canInstall = signal(false);
export const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const isStandalone = () => matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;

let waiting: ServiceWorker | null = null;
/** Solo recargamos al cambiar de SW si lo pidió el usuario (no en la primera instalación). */
let userRequestedUpdate = false;
let deferredPrompt: (Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }) | null = null;

export function registerSW() {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('./sw.js', { scope: './' });
      const onWaiting = (sw: ServiceWorker | null) => {
        if (sw && navigator.serviceWorker.controller) {
          waiting = sw;
          updateReady.value = true;
        }
      };
      onWaiting(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        sw?.addEventListener('statechange', () => sw.state === 'installed' && onWaiting(sw));
      });
      // Comprueba actualizaciones al volver a la app
      document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && reg.update().catch(() => {}));
    } catch {
      /* sin SW: la app sigue funcionando online */
    }
  });
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading || !userRequestedUpdate) return;
    reloading = true;
    location.reload();
  });
}

export function applyUpdate() {
  userRequestedUpdate = true;
  waiting?.postMessage('SKIP_WAITING');
}

export function listenInstall() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as typeof deferredPrompt;
    canInstall.value = true;
  });
  window.addEventListener('appinstalled', () => {
    canInstall.value = false;
    deferredPrompt = null;
  });
}

export async function promptInstall() {
  if (!deferredPrompt) return;
  await deferredPrompt.prompt();
  await deferredPrompt.userChoice.catch(() => null);
  deferredPrompt = null;
  canInstall.value = false;
}
