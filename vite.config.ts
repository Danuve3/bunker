/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite';
import preact from '@preact/preset-vite';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

/**
 * Genera sw.js a partir de src/pwa/sw-template.js con la lista de precarga
 * (todos los archivos del build + public) y una versión derivada de su contenido.
 */
function serviceWorker(): Plugin {
  return {
    name: 'bunker-sw',
    apply: 'build',
    generateBundle(_opts, bundle) {
      const files = Object.keys(bundle).filter((f) => !f.endsWith('.map'));
      const publicFiles = ['manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-192.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png', 'icons/favicon.svg'];
      const precache = ['./', './index.html', ...[...files, ...publicFiles].map((f) => `./${f}`)];
      const hash = createHash('sha256');
      for (const f of files) {
        const item = bundle[f];
        hash.update(f);
        hash.update(item.type === 'chunk' ? item.code : typeof item.source === 'string' ? item.source : Buffer.from(item.source));
      }
      const version = hash.digest('hex').slice(0, 10);
      const src = readFileSync('src/pwa/sw-template.js', 'utf8').replace('__VERSION__', version).replace('__PRECACHE__', JSON.stringify(precache, null, 1));
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: src });
    },
  };
}

/**
 * Despliegue: GitHub Pages "Deploy from a branch" → main → / (raíz).
 * La fuente está en web/ y src/; `npm run build` escribe el sitio compilado en la RAÍZ
 * del repositorio (index.html, assets/, sw.js, manifest.webmanifest, icons/), que es lo
 * que Pages sirve en https://danuve3.github.io/bunker/. Rutas relativas (base './').
 */
export default defineConfig({
  root: 'web',
  base: './',
  plugins: [preact(), serviceWorker()],
  define: { __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? 'dev') },
  server: { fs: { allow: ['..'] } },
  build: {
    outDir: '..',
    emptyOutDir: false, // ¡la raíz es el repositorio! scripts/clean-build.mjs borra solo lo generado
    target: 'es2020',
    assetsInlineLimit: 0,
    sourcemap: false,
  },
  test: {
    root: '.',
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
