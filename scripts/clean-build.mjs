/**
 * Borra la build anterior de la raíz del repositorio antes de compilar.
 * GitHub Pages publica la rama `main` desde la raíz, así que la build vive ahí:
 * index.html, assets/, sw.js, manifest.webmanifest e icons/ son archivos GENERADOS.
 * El código fuente está en src/ y en web/ (web/index.html y web/public/).
 */
import { rmSync } from 'node:fs';

for (const p of ['index.html', 'assets', 'sw.js', 'manifest.webmanifest', 'icons']) rmSync(p, { recursive: true, force: true });
