/**
 * Física del refugio: radiación, blindaje, aire, temperatura y energía.
 */

// ─── Radiación de la lluvia radiactiva ───────────────────────────────────────
// Ley de Way-Wigner: tasa(t) = R1 · t^-1,2 (t en horas desde la detonación).
// Equivale a la "regla 7-10": cada factor 7 de tiempo, la tasa cae ~10×. Fuente: glasstone.
export const FALLOUT = {
  decayExponent: 1.2,
  /** Tasa exterior a H+1 (mSv/h). 1 R/h ≈ 10 mSv/h. Rango jugable para zonas a sotavento
   *  a decenas de km (simplificación de los mapas de Glasstone cap. 9). */
  r1Range: [100, 2500] as [number, number],
  /** Llegada de la lluvia radiactiva tras la detonación (h). */
  arrivalH: 1,
  /** Fracción de partículas que entra con aire NO filtrado, por m³/h de caudal (simplificación). */
  unfilteredIngressPerM3h: 0.0004,
} as const;

// Umbrales de dosis (mSv ≈ mGy para gamma). Fuentes: cdc_ars, afrri.
export const DOSE = {
  noticeable: 100, // sin efectos agudos; aumenta el riesgo de cáncer a largo plazo
  arsThreshold: 700, // SIA: >0,7 Gy (cdc_ars)
  ld50NoCare: 3500, // DL50/60 sin atención médica ~3-4 Gy (afrri)
  lethal: 8000, // síndrome gastrointestinal: casi siempre mortal
  /** Reparación biológica de la dosis aguda (semivida, h). Simplificación del efecto tasa de dosis. */
  repairHalfLifeH: 24 * 21,
  /** Daño a la salud por hora por cada Sv agudo por encima del umbral de SIA (simplificación). */
  dmgPerSvH: 0.22,
  instantDeathMSv: 10000,
} as const;

// ─── Blindaje: espesores de semirreducción frente a la gamma de la lluvia radiactiva ───
// Kearny, Nuclear War Survival Skills (kearny_nwss): acero 0,7", hormigón 2,4",
// tierra compactada 3,6", agua 7,2", madera 8,8".
export const HALF_VALUE_CM = {
  acero: 1.8,
  hormigon: 6.1,
  tierra: 9.1,
  agua: 18.3,
  madera: 22.4,
} as const;
export type ShieldMaterial = keyof typeof HALF_VALUE_CM;

/** Geometría de la cuadrícula (m). Simplificación: celdas de 3 × 2,5 × 3 m. */
export const GRID = {
  cols: 7,
  rows: 7, // fila 0 = superficie
  cellWidthM: 3,
  cellHeightM: 2.5,
  cellDepthM: 3,
  /** Losa de hormigón entre niveles excavados (cm). */
  slabCm: 20,
  /** Forjado de la casa sobre el sótano (cm de hormigón) + estructura (≈ ×2). */
  houseFloorCm: 15,
  houseExtraPF: 2,
} as const;
export const CELL_VOLUME_M3 = GRID.cellWidthM * GRID.cellHeightM * GRID.cellDepthM;

/**
 * Límite del factor de protección (PF) por la entrada: la radiación dispersada entra
 * por el acceso. Un buen refugio tiene giros de 90° (esclusa). FEMA usa PF 40 como mínimo
 * de un buen refugio público (fema_nuclear); los refugios enterrados con entrada en
 * codo superan PF 200-1000 (kearny_nwss). Valores: simplificación.
 */
export const ENTRY_PF_CAP = {
  base: 40,
  esclusa: 400,
  esclusaYPuerta: 1000,
} as const;

// ─── Aire ────────────────────────────────────────────────────────────────────
// CO₂ exhalado ≈ 1,0 kg/persona/día (nasa_bvad: 1,04 kg/día).
// Densidad del CO₂ a 20 °C ≈ 1,84 kg/m³.
export const AIR = {
  co2KgPerDay: 1.0,
  co2DensityKgM3: 1.84,
  outdoorPpm: 420,
  /** Renovaciones/hora por infiltración de un recinto enterrado cerrado (simplificación). */
  leakAch: 0.2,
  /** Caudal de un ventilador con filtro (m³/h). */
  fanM3h: 60,
  /** Bomba manual tipo KAP accionada a mano (kearny_nwss), m³/h medios (simplificación). */
  manualM3h: 180,
  // Umbrales (niosh_co2): 5.000 ppm TWA; 30.000 STEL; 40.000 IDLH.
  stalePpm: 1500,
  pelPpm: 5000,
  stelPpm: 30000,
  idlhPpm: 40000,
  deathPpm: 90000, // 7-10 % provoca pérdida de conciencia (simplificación)
} as const;

// ─── Temperatura del refugio ─────────────────────────────────────────────────
// Por debajo de 2-3 m, la temperatura del terreno ≈ media anual del aire (ashrae_ground).
// Media anual en la mitad de España ≈ 14-16 °C.
export const THERMAL = {
  groundTempC: 14,
  /** Acoplamiento con la temperatura exterior según la fila del refugio (simplificación). */
  surfaceCoupling: [1, 0.35, 0.14, 0.07, 0.04, 0.03, 0.02],
  /** Coeficiente de pérdidas por celda excavada (W/K), simplificación. */
  uaPerCellWK: 25,
  bodyHeatW: 100,
  /** Constante de tiempo térmica de un recinto enterrado (h), simplificación. */
  tauH: 30,
  /** Fracción del calor del generador que queda dentro (escape al exterior). */
  generatorHeatFrac: 0.25,
} as const;

// ─── Energía ─────────────────────────────────────────────────────────────────
export const POWER = {
  lightsW: 12, // tiras LED para 1-2 salas
  /** Consumo de un generador diésel portátil a carga parcial ≈ 0,4-0,6 L/kWh (simplificación). */
  dieselLPerKWh: 0.5,
  dieselIdleLPerH: 0.15,
  generatorW: 3000,
  /** Batería AGM 12 V 100 Ah = 1,2 kWh; uso recomendado ≤50 % de descarga ⇒ 0,6 kWh útiles. */
  batteryUsableWh: 600,
  chargeEfficiency: 0.85,
  /** El modo automático arranca el generador por debajo de esta carga. */
  autoStartFrac: 0.25,
  autoStopFrac: 0.95,
  /** Ruido de un generador (unidades de juego por hora en marcha). */
  generatorNoisePerH: 1,
  /** Una pila (pack) da luz de linterna ~24 h (simplificación). */
  batteryPackLightH: 24,
} as const;
