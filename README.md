# BÚNKER

Roguelite de supervivencia para móvil, en forma de PWA instalable que funciona sin conexión. Eres un único superviviente: preparas tu búnker contra reloj y resistes fases de crisis cada vez más largas frente a una guerra nuclear, una pandemia, un colapso civil o una catástrofe climática (frío extremo, inundación o tormenta solar). Los consumos, tiempos, dosis y efectos salen de fuentes reales: FEMA, CDC, OMS, NIOSH, NASA, Kearny, Glasstone y otras. Jugando aprendes algo de verdad.

**Jugar:** https://danuve3.github.io/bunker/

## Cómo se juega

1. **Fase 0: preparación.** Se anuncia la amenaza con un margen (de horas a días) y un presupuesto. Compra en siete tiendas: cada viaje cuesta tiempo y, a medida que se acerca el evento, las existencias se agotan y los precios suben. Excava salas (a mano o con miniexcavadora), monta módulos, apila sacos terreros, llena la bañera y los depósitos. Cuando quieras, pulsa *Encerrarse ya*.
2. **Fases de crisis** (3, 5, 8, 12, 16, 20… días). Cada día planificas la mañana, la tarde y la noche: mantener equipos, bombear aire, construir, potabilizar, curarte, vigilar, descansar o **salir de expedición**. También fijas las raciones de agua y comida, el ventilador, el generador y las luces. Al pulsar *Vivir el día*, la simulación avanza hora a hora.
3. **Sucesos**: cartas con 2 o 3 decisiones, a veces con consecuencias diferidas u ocultas, y muchas con una ficha **«Dato real»** con su fuente.
4. **Crisis final de fase**: lluvia negra, brote, asalto, ola de frío, crecida, tormenta G5, apagón total… Si la superas, eliges **1 de 3 habilidades** (perks) para la fase siguiente.
5. A partir de la fase 3 o 4 puede encadenarse una **amenaza secundaria** con lógica causal: tras una guerra nuclear llega el colapso civil, tras una inundación una epidemia, etc.
6. La partida termina cuando mueres. La puntuación suma los días sobrevividos, las fases y las crisis superadas, más un bono.

Una partida buena (fase 4-5, unos 30-40 días) dura unos **18-22 minutos**. Se guarda sola después de cada acción, así que puedes cerrar la app en cualquier momento.

- **Búnker del día**: la misma semilla para todos, derivada de la fecha UTC. Lleva su propia racha.
- **Semillas**: `?seed=LOQUESEA` abre una partida concreta. Al morir puedes compartir el resultado y la semilla (Web Share API, o el portapapeles como alternativa).
- **Tutorial guiado** (13 pasos) la primera vez. Se puede saltar y repetir desde el menú o los ajustes.
- **Récords locales**: mejor partida por amenaza, días totales, causas de muerte, últimas partidas y racha diaria.

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
npm run build
```

```bash
npm run balance -- 300
```

`npm run balance` simula cientos de partidas con cinco bots de estrategias distintas (pasivo, acaparador, constructor, explorador y equilibrado). Para cada uno muestra la fase media, el porcentaje que supera la fase 1, las causas de muerte y el recurso que se agota. El último resultado está en [`docs/balance.txt`](docs/balance.txt).

Para regenerar los iconos y las pantallas de inicio de iOS (requiere Playwright con Chromium):

```bash
node scripts/gen-icons.cjs
```

### Stack y arquitectura

- **TypeScript + Vite + Preact/signals**: unos 87 KB gz de JS en total, contenido incluido.
- **Simulación pura y determinista** en `src/core/`, sin DOM. La interfaz solo llama a `dispatch(estado, acción) → estado`. El PRNG es **sfc32 sembrado con cyrb128** y su estado se guarda con la partida: misma semilla y mismas acciones dan exactamente la misma partida. La lógica de juego no usa `Math.random()`.

```
src/core/      Simulación: estado, PRNG, sistemas horarios, fase 0, días, cartas, expediciones, perks
src/data/      TODOS los valores numéricos, cada uno con su fuente o marcado como simplificación
src/i18n/      Todos los textos en español (UI, contenido, 99 cartas), listos para traducir
src/ui/        Preact: corte lateral del búnker en SVG, clima en Canvas, pantallas y hojas
src/audio/     Motor Web Audio 100 % sintetizado (sin archivos)
src/platform/  IndexedDB con respaldo en localStorage, récords, compartir, vibración
src/pwa/       Plantilla del Service Worker, registro, actualización e instalación
scripts/       Bots, balanceo y generador de iconos
tests/         Vitest: determinismo, regla 7-10, blindaje, CO₂, agua, almacén, expediciones, contenido, perks, récords
```

### Sistemas simulados (hora a hora)

Hidratación (déficit en litros), energía (kcal por actividad según MET, tiritona), temperatura central, fatiga y sueño, ánimo (la soledad pesa), higiene, infecciones (incubación, curva de gravedad, cuidados, SRO, antibióticos), heridas, dosis aguda con reparación biológica, CO₂ (modelo de recinto bien mezclado con infiltración, ventilador filtrado y bomba manual), temperatura del refugio (acoplada al terreno según la profundidad), energía (red, generador diésel, baterías, linterna), averías y desgaste, almacén por salas, ruido y visibilidad, y saqueadores.

## Despliegue

Cada push a `main` ejecuta `.github/workflows/deploy.yml`: tests, build con `base: '/bunker/'` y publicación en GitHub Pages con `actions/upload-pages-artifact` y `actions/deploy-pages`.

**Configuración necesaria, una sola vez:** *Settings → Pages → Build and deployment → Source: **GitHub Actions***. Si está en "Deploy from branch", Pages sirve el código fuente sin compilar y la página sale en blanco.

### PWA

- `manifest.webmanifest` con `start_url` y `scope` relativos (`./`), `display: standalone` y `orientation: portrait`.
- Iconos de 192 y 512 px, maskable, `apple-touch-icon`, favicon SVG y 11 pantallas de inicio de iOS.
- Service Worker propio: precaché de todo el build, con la lista inyectada por un plugin de Vite. La caché se versiona con un hash del contenido y borra las anteriores. Funciona **100 % sin conexión** (verificado con Playwright en modo avión) y avisa con «Nueva versión disponible → Recargar».
- Botón «Instalar» (`beforeinstallprompt`) e instrucciones para iOS.

## Balanceo (300 partidas por bot)

| Estrategia | Fase media | Días medios | Supera la fase 1 |
|---|---|---|---|
| Pasivo (no hace nada) | 2,3 | 8,5 | 97 % |
| Acaparador | 5,0 | 40,0 | 100 % |
| Constructor | 4,7 | 35,2 | 100 % |
| Explorador | 4,6 | 33,3 | 100 % |
| Equilibrado | 4,6 | 33,6 | 100 % |

La primera fase se supera, pero quien no se prepara muere en la segunda (deshidratación). Las estrategias activas quedan dentro de un ±10 %, así que ninguna domina. La comida es el recurso que limita a largo plazo, lo que empuja a salir de expedición. Las amenazas matan también por su propio mecanismo: radiación (~6 %), infección (~5 %), hipotermia y heridas.

## Accesibilidad

Botones de 44-56 px, `safe-area-inset`, texto escalable (A / A+ / A++), contraste alto, `prefers-reduced-motion` (se detienen las animaciones y la capa de clima), foco visible, búnker y mapa manejables con el teclado, etiquetas ARIA y textos de estado en vivo. La vibración se puede desactivar y degrada sin errores donde no existe (iOS).

## Fuentes de los datos

| Dato | Valor en el juego | Fuente |
|---|---|---|
| Agua por persona y día | 3,8 L (2,5 bebida + 1,3 higiene) | [FEMA / Ready.gov — Water](https://www.ready.gov/water) |
| Potabilizar | 2 gotas de lejía/L y 30 min, o hervir 1 min (3 en altitud) | [CDC — Make Water Safe](https://www.cdc.gov/water-emergency/about/) |
| Deshidratación | ~2 % de peso: sed; ~5 %: síntomas; ~10-15 %: grave o mortal | [OMS — Diarrhoeal disease](https://www.who.int/news-room/fact-sheets/detail/diarrhoeal-disease) |
| Rehidratación oral | SRO contra la diarrea y el cólera | [OMS — Cholera](https://www.who.int/news-room/fact-sheets/detail/cholera) |
| Energía diaria | 2.000-2.500 kcal | [EFSA — DRV for energy](https://www.efsa.europa.eu/en/efsajournal/pub/3005) |
| Gasto por actividad | MET por actividad | [Compendium of Physical Activities](https://pacompendium.com/) |
| CO₂ exhalado | ~1 kg/persona/día | [NASA — BVAD](https://ntrs.nasa.gov/citations/20180001338) |
| Límites de CO₂ | 5.000 ppm TWA, 30.000 STEL, 40.000 IDLH | [NIOSH Pocket Guide](https://www.cdc.gov/niosh/npg/npgd0103.html) |
| Lluvia radiactiva | tasa ∝ t^-1,2 (regla 7-10) | Glasstone & Dolan, *The Effects of Nuclear Weapons* |
| Semirreducción gamma | acero 1,8 cm; hormigón 6,1; tierra 9,1; agua 18,3; madera 22,4 | Kearny, *Nuclear War Survival Skills* |
| Refugio | PF 40 como buen refugio; quitarse la ropa elimina ~90 % de la contaminación | [Ready.gov — Nuclear Explosion](https://www.ready.gov/nuclear-explosion) |
| Síndrome de irradiación aguda | >0,7 Gy; DL50/60 sin tratamiento ≈ 3-4 Gy | [CDC — ARS](https://www.cdc.gov/radiation-emergencies/hcp/clinical-guidance/ars.html); AFRRI |
| Yoduro potásico | Solo protege el tiroides frente al I-131 | [OMS — Iodine thyroid blocking](https://www.who.int/publications/i/item/9789240089556) |
| Hipotermia | <35 °C; no frotar las zonas congeladas | [NIOSH — Cold Stress](https://www.cdc.gov/niosh/cold-stress/) |
| Monóxido de carbono | Nunca usar generadores en interiores | [CDC — CO poisoning](https://www.cdc.gov/carbon-monoxide/) |
| Mascarillas y filtros | FFP2 ≥94 %, N95 ≥95 %, HEPA 99,97 % a 0,3 µm | NIOSH; EN 149; DOE-STD-3020 |
| Gripe | Incubación de 1-4 días; contagio antes de los síntomas | [CDC — Flu](https://www.cdc.gov/flu/about/) |
| Superficies | Virus viable hasta 72 h en plástico | [NEJM 2020](https://www.nejm.org/doi/full/10.1056/NEJMc2004973) |
| Humedad y moho | Riesgo respiratorio | [OMS — Dampness and mould](https://www.who.int/publications/i/item/9789289041683) |
| Bulos | Ingerir lejía no protege de nada | [OMS — Mythbusters](https://www.who.int/emergencies/diseases/novel-coronavirus-2019/advice-for-public/myth-busters) |
| Botulismo | No consumir latas abombadas | [CDC — Botulism](https://www.cdc.gov/botulism/prevention/) |
| Tormenta solar | Escala G1-G5; la eyección llega en 15 h-3 días | [NOAA SWPC](https://www.swpc.noaa.gov/noaa-scales-explanation) |
| Temperatura del subsuelo | ≈ media anual del aire a más de 2-3 m | [U.S. DOE — Geothermal heat pumps](https://www.energy.gov/energysaver/geothermal-heat-pumps) |
| Precios | Valores medios orientativos en España (2025) | Mercado; simplificación |

La lista completa está en `src/data/sources.ts`. Los valores que son simplificaciones jugables (reservas corporales, curvas de infección, caudales, producción hidropónica…) están marcados como tales en su comentario.

## Hoja de ruta

- [x] H0: esqueleto y despliegue
- [x] H1: núcleo de simulación, fase 0 y fase 1 jugables, autoguardado y tests
- [x] H2: construcción completa (almacén, 16 módulos, averías, sacos en la casa o el jardín) y clima en Canvas
- [x] H3: expediciones (mapa procedural, exposición, botín con límite de peso, 9 encuentros)
- [x] H4: 76 eventos, 9 encuentros y 14 crisis finales (39 con «Dato real»), y amenazas secundarias encadenadas
- [x] H5: 34 perks (1 de 3), récords y estadísticas, racha del Búnker del día y compartir
- [x] H6: PWA completa (manifest, iconos y splash generados, Service Worker sin conexión y versionado, aviso de actualización, instalar)
- [x] H7: audio generativo (viento, lluvia, generador, Geiger, latido, efectos, alarmas) y vibración, con ajustes
- [x] H8: tutorial guiado (13 pasos, fases 0 y 1 cortas, saltable y repetible)
- [x] H9: balanceo con cinco bots, accesibilidad, pulido y README
