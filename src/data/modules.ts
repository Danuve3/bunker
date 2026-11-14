/**
 * Módulos del búnker y excavación.
 * Tiempos y consumos: estimaciones plausibles para una persona sola con herramientas
 * básicas (simplificación). Las potencias son de equipos domésticos comunes.
 */
import type { CellKind, ModuleType } from '../core/types';

export interface ModuleData {
  hours: number; // horas de trabajo para montarlo
  requires: Record<string, number>; // inventario consumido
  powerW?: number; // consumo continuo cuando funciona
  /** Desgaste diario de condición (0..1). */
  wearPerDay: number;
  /** Tier de construcción en H1 (los demás llegan en H2). */
  minPhase?: number;
  // Efectos (leídos por los sistemas):
  sleepQuality?: number;
  airflowM3h?: number;
  filtered?: boolean;
  batteryWh?: number;
  waterCapL?: number;
  spoilMult?: number;
  hygieneDrainMult?: number;
  gastroRiskMult?: number;
  moraleBonus?: number;
  doorStrength?: number;
  entryCap?: 'esclusa' | 'puerta';
  healMult?: number;
  repairMult?: number;
  potabilizeMult?: number;
  noisePerH?: number;
  kcalPerDay?: number;
}

export const MODULES: Record<ModuleType, ModuleData> = {
  dormitorio: { hours: 4, requires: { madera: 4 }, wearPerDay: 0.002, sleepQuality: 1 },
  despensa: { hours: 3, requires: { madera: 3 }, wearPerDay: 0.002, spoilMult: 0.7 },
  deposito_agua: { hours: 3, requires: { deposito_500: 1 }, wearPerDay: 0.003, waterCapL: 500 },
  generador: { hours: 5, requires: { generador_diesel: 1, madera: 2 }, wearPerDay: 0.012, noisePerH: 1 },
  baterias: { hours: 3, requires: { bateria_agm: 2 }, wearPerDay: 0.004, batteryWh: 1200 },
  ventilacion: { hours: 4, requires: { ventilador_filtro: 1 }, powerW: 35, wearPerDay: 0.01, airflowM3h: 60, filtered: true },
  letrina: { hours: 2, requires: { inodoro_quimico: 1 }, wearPerDay: 0.005, hygieneDrainMult: 0.6, gastroRiskMult: 0.3 },
  enfermeria: { hours: 4, requires: { madera: 3, botiquin: 1 }, wearPerDay: 0.002, healMult: 1.5 },
  // Retirados de la construcción para simplificar (se conservan sus efectos por compatibilidad):
  taller: { hours: 5, requires: { madera: 6, herramientas: 1 }, wearPerDay: 0.003, repairMult: 1.6, minPhase: 99 },
  // LED de cultivo ~60 W. Producción: simplificación optimista (patata/legumbre en bandejas).
  hidroponico: { hours: 6, requires: { kit_hidroponico: 1, madera: 2 }, powerW: 60, wearPerDay: 0.008, kcalPerDay: 350 },
  radio: { hours: 3, requires: { emisora: 1, madera: 1 }, powerW: 8, wearPerDay: 0.003, moraleBonus: 1 },
  esclusa: { hours: 6, requires: { madera: 6, plastico_cinta: 1, cemento: 4 }, wearPerDay: 0.002, entryCap: 'esclusa' },
  puerta_blindada: { hours: 4, requires: { puerta_acero: 1, cemento: 2 }, wearPerDay: 0.001, doorStrength: 0.85, entryCap: 'puerta' },
  periscopio: { hours: 3, requires: { tubo_periscopio: 1, madera: 1 }, wearPerDay: 0.002, minPhase: 99 },
  ocio: { hours: 3, requires: { madera: 2, libros_juegos: 1 }, wearPerDay: 0.002, moraleBonus: 2 },
  purificador: { hours: 3, requires: { filtro_agua: 1 }, wearPerDay: 0.004, potabilizeMult: 2, minPhase: 99 },
};

/**
 * Almacén (simplificación): 1 punto = 1 L de agua o diésel, o 1 kg de comida (~3.000 kcal/kg
 * de media con envases). Una sala vacía admite estanterías; un módulo deja poco hueco.
 */
export const STORAGE = {
  emptyCell: 400,
  moduleCell: 100,
  despensaFood: 1500, // kg extra solo para comida
  depositoWater: 500, // L extra solo para agua
  kcalPerKg: 3000,
  overMoralePerDay: -3,
} as const;

/** Hidropónico: días de crecimiento antes de la primera cosecha y agua diaria. */
export const HYDRO = { growDays: 21, waterLPerDay: 2, minPoweredHours: 14 } as const;

/** El ruido del generador se amortigua con la profundidad (multiplicador por fila). */
export const GEN_NOISE_BY_ROW = [1, 1, 0.5, 0.3, 0.2, 0.15, 0.1] as const;

/** Fuerza de una puerta normal de sótano (probabilidad de aguantar un asalto). */
export const BASE_DOOR_STRENGTH = 0.35;

// ─── Excavación ──────────────────────────────────────────────────────────────
// Una persona en forma excava ~0,5-1 m³/h de tierra suelta a pala (simplificación);
// la arcilla y la roca son mucho más lentas y sacar escombro desde abajo cuesta más.
export const DIG = {
  m3PerHour: { tierra: 0.8, arcilla: 0.55, roca: 0.12, hueco: 0 } satisfies Record<CellKind, number>,
  depthPenaltyPerRow: 0.2,
  noToolsMult: 0.4,
  /** Entibado y revestimiento por celda: madera (tablones) y sacos de cemento. */
  shoring: { madera: 4, cemento: 3 },
} as const;

/** Sacos terreros sobre la casa: ~36 sacos llenos cubren 9 m² con ~10 cm de tierra. */
export const COVER = { sacosPerLayer: 36, cmPerLayer: 10, hoursPerLayer: 2.5, maxCm: 90 } as const;

/** Mantenimiento: condición recuperada por franja de 6 h (repartida entre los módulos peor conservados). */
export const MAINTENANCE = { conditionPerFranja: 0.5, breakBelow: 0.25, breakChancePerDay: 0.25, repairCost: { madera: 1 } } as const;
