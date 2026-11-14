/**
 * Fisiología del superviviente (adulto ~70 kg).
 * Unidades: litros, kcal, °C, horas. Cada valor indica su fuente o si es simplificación.
 */
import type { DayActivity, FoodRation, InfectionKind, WaterRation } from '../core/types';

// ─── Agua ────────────────────────────────────────────────────────────────────
// FEMA: 1 galón (~3,8 L) por persona y día para beber + higiene básica.
// Fuente: fema_water. Reparto bebida/higiene: simplificación (≈2,5 + 1,3).
export const WATER = {
  drinkNeedLPerDay: 2.5, // necesidad de bebida en reposo, clima templado (fema_water, simplificado)
  extraPerHeavyHourL: 0.15, // sudoración en trabajo pesado (simplificación)
  extraPerHotDegreeL: 0.08, // por cada °C interior por encima de 26 °C, al día (simplificación)
  rations: {
    normal: { drink: 2.5, hygiene: 1.3 }, // = 3,8 L/día (fema_water)
    reducida: { drink: 2.0, hygiene: 0.5 },
    minima: { drink: 1.5, hygiene: 0 }, // mínimo de supervivencia ~2 L citado en guías; aquí por debajo
  } satisfies Record<WaterRation, { drink: number; hygiene: number }>,
  // Déficit de agua corporal (70 kg ⇒ ~42 L de agua corporal; 1 % de peso ≈ 0,7 L).
  // ~2 % sed y bajo rendimiento; ~5 % cefalea y fatiga; ~10 % grave; ~15 % mortal.
  // Fuente: who_dehydration (escala clínica de deshidratación), simplificada a litros.
  deficitThirstL: 1.5,
  deficitModerateL: 3.5,
  deficitSevereL: 7,
  deficitDeathL: 10.5,
  /** Recuperación: el cuerpo repone déficit si bebe por encima de la necesidad (L/h máx.). */
  rehydrateMaxLPerH: 0.4,
  hygieneDrainPerDay: 25, // puntos de higiene perdidos al día sin agua de aseo (simplificación)
} as const;

// ─── Energía ─────────────────────────────────────────────────────────────────
// EFSA: 2.000–2.500 kcal/día para adultos sedentarios-moderados (efsa_energy).
// Gasto por hora según MET del Compendium (pa_compendium): dormir ~0,95 MET,
// reposo ~1,3, trabajo ligero ~2,5, pico y pala ~5 (con pausas). 1 MET ≈ 1 kcal/kg/h.
export const ENERGY = {
  kcalPerHour: {
    dormir: 65,
    reposo: 90,
    ligero: 170,
    pesado: 320,
  },
  rations: {
    completa: 2300,
    reducida: 1500,
    minima: 800,
  } satisfies Record<FoodRation, number>,
  // "Regla de 3": unas 3 semanas sin comida. Simplificación: reservas útiles ~55.000 kcal
  // (≈7 kg de grasa); debilidad a −15.000, daño a −30.000, muerte a −55.000.
  deficitWeakKcal: -15000,
  deficitSevereKcal: -30000,
  deficitDeathKcal: -55000,
  /** Kcal extra por hora y °C de estrés por frío compensado tiritando (simplificación). */
  shiverKcalPerDegreeHour: 12,
} as const;

/** Intensidad física de cada actividad diurna. */
export const ACTIVITY_INTENSITY: Record<DayActivity, keyof typeof ENERGY.kcalPerHour> = {
  descansar: 'reposo',
  mantener: 'ligero',
  ventilar: 'pesado', // bomba de aire manual (Kearny Air Pump), esfuerzo sostenido
  construir: 'pesado',
  ocio: 'reposo',
  radio: 'reposo',
  curar: 'ligero',
  potabilizar: 'ligero',
  vigilar: 'ligero',
};

// ─── Temperatura corporal ────────────────────────────────────────────────────
// Hipotermia: <35 °C; moderada <32 °C; grave <28 °C (niosh_cold).
export const THERMO = {
  normalC: 37,
  hypothermiaC: 35,
  moderateC: 32,
  deathC: 28,
  /** Temperatura ambiente mínima confortable en reposo con ropa de interior (simplificación). */
  comfortBaseC: 18,
  /** Calor metabólico extra al trabajar (equivale a °C de confort). */
  workHeatC: { reposo: 0, dormir: -2, ligero: 3, pesado: 7 },
  /** El cuerpo compensa (tiritando) hasta este estrés sin bajar la temperatura central. */
  compensatedStressC: 4,
  coolingPerStressDegreeH: 0.035, // °C/h por grado de estrés no compensado (simplificación)
  rewarmPerH: 0.35,
  // Aislamiento del equipo, en °C de confort ganados (simplificación basada en clo).
  gear: {
    ropa_termica: 6,
    mantas: 4,
    saco_dormir: 12, // solo durmiendo
  },
} as const;

// ─── Fatiga y sueño ──────────────────────────────────────────────────────────
export const FATIGUE = {
  perHour: { dormir: -9, reposo: -1.2, ligero: 2, pesado: 4.5 },
  guardPerHour: 1.6,
  slowThreshold: 70, // por encima, rendimiento reducido
  collapseAt: 100, // colapso: duermes a la fuerza
  sleepHoursPerNight: 8,
} as const;

// ─── Moral / cordura ─────────────────────────────────────────────────────────
// El aislamiento social prolongado deteriora el ánimo y el sueño (simplificación jugable).
export const MORALE = {
  start: 70,
  dailyIsolation: -3,
  darkness: -6, // un día entero sin luz
  highCo2: -2,
  hunger: -3, // ración mínima
  thirst: -3,
  dirty: -2, // higiene < 30
  ocioFranja: 8,
  ocioModuleBonus: 6,
  booksBonus: 3,
  radioFranja: 5,
  insomniaBelow: 25, // sueño menos reparador
  breakdownBelow: 10, // rendimiento a la mitad
} as const;

// ─── Salud ───────────────────────────────────────────────────────────────────
export const HEALTH = {
  regenPerH: 0.25,
  restRegenMult: 1.6,
  dehydrationDmgPerLH: 0.25, // por litro de déficit por encima del moderado, por hora
  starvationDmgPer10kH: 0.06,
  hypothermiaDmgPerDegH: 1.0,
  infectionDmgPerSevH: 0.03, // por punto de gravedad por encima de 40
  injuryDmgPerPointH: 0.02, // por punto de herida por encima de 30
  co2DmgPer10kH: 0.5, // por cada 10.000 ppm por encima de 30.000
} as const;

// ─── Infecciones ─────────────────────────────────────────────────────────────
// Gastroenteritis por agua/higiene: pérdida de líquidos; las SRO la tratan (who_ors).
// Gripe/respiratoria: incubación 1-4 días (cdc_flu). Agente pandémico: simplificación.
export interface InfectionData {
  incubationH: [number, number];
  activeH: [number, number];
  peak: [number, number];
  waterLossLPerH: number;
  fatigueMult: number;
}
export const INFECTIONS: Record<InfectionKind, InfectionData> = {
  gastro: { incubationH: [12, 48], activeH: [48, 120], peak: [35, 70], waterLossLPerH: 0.07, fatigueMult: 1.3 },
  herida: { incubationH: [24, 72], activeH: [72, 168], peak: [40, 85], waterLossLPerH: 0.01, fatigueMult: 1.2 },
  respiratoria: { incubationH: [24, 96], activeH: [96, 168], peak: [30, 60], waterLossLPerH: 0.02, fatigueMult: 1.4 },
  pandemia: { incubationH: [48, 168], activeH: [120, 240], peak: [55, 95], waterLossLPerH: 0.03, fatigueMult: 1.6 },
};

/** Cuidados: cuánto reduce cada recurso el pico de la infección activa (fracción). */
export const CARE = {
  restPeakReductionPerFranja: 0.04,
  curarPeakReduction: 0.12,
  antibioticoHerida: 0.5, // los antibióticos solo sirven contra infecciones bacterianas
  analgesicoFatigue: 0.6,
  sroWaterLossMult: 0.35, // SRO: OMS/UNICEF (who_ors)
  bandageInjury: 15, // puntos de herida curados por botiquín
} as const;
