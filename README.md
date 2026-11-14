# BÚNKER

Roguelite de supervivencia para móvil (PWA). Un único superviviente prepara su búnker contra reloj y resiste fases de crisis cada vez más largas: guerra nuclear, pandemia, colapso civil o catástrofe climática. Los consumos, los tiempos y los efectos se basan en datos reales (FEMA, CDC, OMS, NIOSH, NASA, Kearny…).

**Jugar:** https://danuve3.github.io/bunker/

> Estado: en desarrollo por hitos (ver hoja de ruta).

## Cómo se juega

1. **Fase 0: preparación.** Se anuncia una amenaza, con un margen de horas a días y un presupuesto. Compra en las tiendas (cada viaje cuesta tiempo y las existencias se agotan con el pánico), excava salas y construye módulos. Pulsa *Encerrarse ya* o espera a que llegue el evento.
2. **Fases de crisis.** Cada día eliges qué haces por la mañana, por la tarde y por la noche, y fijas las raciones de agua y comida, la ventilación, el generador y las luces. Luego pulsas *Vivir el día*: la simulación avanza hora a hora.
3. **Crisis final de fase.** Al terminar cada fase (3, 5, 8, 12, 16, 20… días) llega una crisis con decisiones. Si sobrevives, empieza la siguiente fase.
4. La partida termina cuando mueres. Puntuación: días sobrevividos, fases y crisis superadas.

Se guarda solo después de cada acción (IndexedDB), así que puedes cerrar la app cuando quieras. Para jugar con una semilla concreta, abre `?seed=TUSEMILLA`.

## Desarrollo local

Requisitos: Node 20 o superior.

```bash
npm install
```

```bash
npm run dev
```

Abre http://localhost:5173/bunker/

```bash
npm test
```

```bash
npm run balance -- 300
```

`npm run balance` simula cientos de partidas con bots y muestra la fase media alcanzada, las causas de muerte y los recursos que se agotan.

### Arquitectura

```
src/core/     Simulación pura y determinista (sin DOM): estado, PRNG sfc32, sistemas, reductor
src/data/     TODOS los valores numéricos, con su fuente en un comentario
src/i18n/     Todos los textos (español), separados de la lógica
src/ui/       Preact + signals; vista del búnker en SVG
src/platform/ Almacenamiento (IndexedDB con respaldo en localStorage)
scripts/      Bots y script de balanceo
tests/        Vitest: determinismo, regla 7-10, blindaje, CO₂, consumos
```

La interfaz solo habla con la simulación a través de `dispatch(estado, acción)`. La misma semilla con las mismas acciones da exactamente la misma partida.

## Despliegue

Cada push a `main` ejecuta `.github/workflows/deploy.yml`: tests, build de Vite con `base: '/bunker/'` y publicación en GitHub Pages.

Configuración necesaria, una sola vez: **Settings → Pages → Build and deployment → Source: _GitHub Actions_**.

## Fuentes de los datos

| Dato | Valor en el juego | Fuente |
|---|---|---|
| Agua por persona y día | 3,8 L (bebida + higiene) | FEMA / Ready.gov, *Water* |
| Potabilizar | 2 gotas de lejía/L (30 min) o hervir 1 min | CDC, *Make Water Safe in an Emergency* |
| Energía diaria | 2.000–2.500 kcal | EFSA, *DRV for energy* |
| Gasto por actividad | MET por actividad | *Compendium of Physical Activities* |
| CO₂ exhalado | ~1 kg/persona/día | NASA, *BVAD* |
| Límites de CO₂ | 5.000 ppm TWA; 30.000 ppm STEL; 40.000 ppm IDLH | NIOSH Pocket Guide |
| Lluvia radiactiva | tasa ∝ t^-1,2 (regla 7-10) | Glasstone & Dolan, *The Effects of Nuclear Weapons* |
| Semirreducción gamma | acero 1,8 cm; hormigón 6,1; tierra 9,1; agua 18,3; madera 22,4 | Kearny, *Nuclear War Survival Skills* |
| Factor de protección | PF 40 como buen refugio; sótano ≈10 | FEMA / Ready.gov |
| Síndrome de irradiación aguda | >0,7 Gy; DL50/60 sin tratamiento ≈3–4 Gy | CDC; AFRRI |
| Hipotermia | <35 °C | NIOSH, *Cold Stress* |
| Rehidratación oral | SRO contra la diarrea | OMS / UNICEF |
| Mascarillas y filtros | FFP2 ≥94 %, N95 ≥95 %, HEPA 99,97 % a 0,3 µm | NIOSH; EN 149; DOE-STD-3020 |
| Tormenta solar | escala G1–G5; la eyección llega en 15 h–3 días | NOAA SWPC |
| Botulismo | no consumir latas abombadas | CDC |
| Precios | valores medios orientativos en España, 2025 | mercado (simplificación) |

La lista completa con enlaces está en `src/data/sources.ts`. Los valores que son simplificaciones jugables están marcados como tales en su comentario.

## Hoja de ruta

- [x] H0: esqueleto y despliegue
- [x] H1: núcleo de simulación, fase 0 y fase 1 jugables, autoguardado y tests
- [x] H2: construcción completa (almacén, 16 módulos, averías, sacos en casa o jardín) y clima en Canvas
- [x] H3: expediciones al exterior (mapa procedural, exposición, botín con peso, 9 encuentros)
- [x] H4: 76 eventos + 9 encuentros + 14 crisis finales (39 con «Dato real») y amenazas secundarias encadenadas
- [x] H5: 34 perks (1 de 3), récords y estadísticas, racha del Búnker del día, compartir
- [x] H6: PWA completa (manifest, iconos y splash generados, Service Worker offline versionado, aviso de actualización, instalar)
- [ ] H7: audio generativo y vibración
- [ ] H8: tutorial guiado
- [ ] H9: balanceo, accesibilidad y pulido
