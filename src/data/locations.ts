/**
 * Lugares cercanos para las expediciones (mapa procedural pequeño).
 * Distancias y tiempos: caminar con carga ~3,5 km/h (simplificación).
 */
import type { ThreatId } from '../core/types';

export type LocType = 'farmacia' | 'super' | 'gasolinera' | 'ferreteria' | 'hospital' | 'casa' | 'rio' | 'huerto' | 'colegio';
import type { LootFocus } from '../core/types';
export type { LootFocus };

export interface LootEntry {
  /** id de inventario, o 'food' (kcal), 'agua'/'aguaBruta'/'diesel' (L). */
  id: string;
  min: number;
  max: number;
  /** Probabilidad de encontrarlo en una búsqueda completa. */
  p: number;
  cat: LootFocus;
  food?: string; // tipo de comida para la caducidad
}

export interface LocData {
  distKm: [number, number];
  count: [number, number];
  /** Riesgo base de encuentro con otras personas (por expedición). */
  encounter: number;
  /** Multiplicador del contagio exterior mientras buscas (pandemia). */
  infectionMult: number;
  /** Protección del edificio mientras buscas dentro (PF aproximado). */
  buildingPF: number;
  /** Riesgo de pequeña herida (cristales, escombros). */
  injury: number;
  loot: LootEntry[];
  /** Amenazas en las que el lugar es más peligroso (×1,5 encuentros). */
  hot?: ThreatId[];
}

export const LOCATIONS: Record<LocType, LocData> = {
  farmacia: {
    distKm: [0.3, 1.5], count: [1, 2], encounter: 0.25, infectionMult: 2, buildingPF: 3, injury: 0.05, hot: ['pandemia'],
    loot: [
      { id: 'analgesicos', min: 1, max: 3, p: 0.7, cat: 'medicina' },
      { id: 'sro', min: 1, max: 3, p: 0.6, cat: 'medicina' },
      { id: 'antibiotico', min: 1, max: 2, p: 0.35, cat: 'medicina' },
      { id: 'botiquin', min: 1, max: 1, p: 0.4, cat: 'medicina' },
      { id: 'ffp2', min: 5, max: 20, p: 0.4, cat: 'medicina' },
      { id: 'food', min: 800, max: 2500, p: 0.3, cat: 'comida', food: 'galletas' },
    ],
  },
  super: {
    distKm: [0.4, 2], count: [1, 2], encounter: 0.4, infectionMult: 1.5, buildingPF: 3, injury: 0.06, hot: ['colapso'],
    loot: [
      { id: 'food', min: 3000, max: 15000, p: 0.85, cat: 'comida', food: 'conserva_plato' },
      { id: 'agua', min: 8, max: 24, p: 0.6, cat: 'agua' },
      { id: 'lejia_ml', min: 1000, max: 2000, p: 0.4, cat: 'agua' },
      { id: 'pilas', min: 1, max: 2, p: 0.4, cat: 'materiales' },
      { id: 'higiene', min: 1, max: 1, p: 0.4, cat: 'medicina' },
    ],
  },
  gasolinera: {
    distKm: [0.5, 2.5], count: [1, 1], encounter: 0.35, infectionMult: 1, buildingPF: 2, injury: 0.05,
    loot: [
      { id: 'diesel', min: 5, max: 20, p: 0.55, cat: 'combustible' },
      { id: 'food', min: 1000, max: 4000, p: 0.6, cat: 'comida', food: 'galletas' },
      { id: 'agua', min: 4, max: 12, p: 0.5, cat: 'agua' },
      { id: 'gas', min: 1, max: 4, p: 0.3, cat: 'combustible' },
    ],
  },
  ferreteria: {
    distKm: [0.5, 2.5], count: [1, 1], encounter: 0.2, infectionMult: 1, buildingPF: 3, injury: 0.08,
    loot: [
      { id: 'madera', min: 3, max: 8, p: 0.7, cat: 'materiales' },
      { id: 'cemento', min: 1, max: 3, p: 0.6, cat: 'materiales' },
      { id: 'sacos', min: 10, max: 30, p: 0.5, cat: 'materiales' },
      { id: 'filtro_hepa', min: 1, max: 1, p: 0.3, cat: 'materiales' },
      { id: 'pilas', min: 1, max: 3, p: 0.5, cat: 'materiales' },
      { id: 'plastico_cinta', min: 1, max: 1, p: 0.5, cat: 'materiales' },
    ],
  },
  hospital: {
    distKm: [1.2, 3], count: [0, 1], encounter: 0.45, infectionMult: 4, buildingPF: 5, injury: 0.05, hot: ['pandemia'],
    loot: [
      { id: 'antibiotico', min: 1, max: 4, p: 0.6, cat: 'medicina' },
      { id: 'botiquin', min: 1, max: 2, p: 0.6, cat: 'medicina' },
      { id: 'sro', min: 2, max: 5, p: 0.5, cat: 'medicina' },
      { id: 'analgesicos', min: 2, max: 5, p: 0.6, cat: 'medicina' },
      { id: 'ffp2', min: 10, max: 40, p: 0.6, cat: 'medicina' },
      { id: 'agua', min: 6, max: 20, p: 0.4, cat: 'agua' },
    ],
  },
  casa: {
    distKm: [0.1, 0.8], count: [2, 3], encounter: 0.15, infectionMult: 1, buildingPF: 2, injury: 0.04,
    loot: [
      { id: 'food', min: 1500, max: 6000, p: 0.7, cat: 'comida', food: 'pasta' },
      { id: 'agua', min: 4, max: 16, p: 0.5, cat: 'agua' },
      { id: 'aguaBruta', min: 20, max: 80, p: 0.5, cat: 'agua' },
      { id: 'mantas', min: 1, max: 1, p: 0.4, cat: 'materiales' },
      { id: 'gas', min: 1, max: 2, p: 0.3, cat: 'combustible' },
      { id: 'madera', min: 1, max: 4, p: 0.4, cat: 'materiales' },
      { id: 'libros_juegos', min: 1, max: 1, p: 0.2, cat: 'materiales' },
    ],
  },
  rio: {
    distKm: [0.6, 2.5], count: [0, 1], encounter: 0.12, infectionMult: 0.5, buildingPF: 1, injury: 0.03,
    loot: [{ id: 'aguaBruta', min: 20, max: 25, p: 1, cat: 'agua' }],
  },
  huerto: {
    distKm: [0.3, 1.8], count: [0, 1], encounter: 0.1, infectionMult: 0.5, buildingPF: 1, injury: 0.03,
    loot: [
      { id: 'food', min: 1500, max: 5000, p: 0.75, cat: 'comida', food: 'fresco' },
      { id: 'aguaBruta', min: 10, max: 25, p: 0.4, cat: 'agua' },
    ],
  },
  colegio: {
    distKm: [0.5, 2], count: [0, 1], encounter: 0.3, infectionMult: 2, buildingPF: 4, injury: 0.04,
    loot: [
      { id: 'food', min: 2000, max: 8000, p: 0.6, cat: 'comida', food: 'conserva_plato' },
      { id: 'agua', min: 10, max: 30, p: 0.5, cat: 'agua' },
      { id: 'botiquin', min: 1, max: 1, p: 0.4, cat: 'medicina' },
      { id: 'mantas', min: 1, max: 2, p: 0.4, cat: 'materiales' },
    ],
  },
};

export const EXPEDITION = {
  walkKmH: 3.5,
  franjaH: 6,
  /** Horas de búsqueda para registrar a fondo un lugar. */
  fullSearchH: 4,
  /** Cuánto se agota un lugar con una búsqueda completa. */
  depletionPerFullSearch: 0.35,
  /** Carga máxima: mochila de 65 L y bolsas (simplificación). */
  carryKg: 25,
  /** Fuera, la mitad del tiempo vas por la calle (PF 1) y la otra mitad dentro de edificios. */
  streetFrac: 0.5,
  maskInfectionMult: 0.06, // FFP2 ≥94 % (niosh_n95)
  visibilityPerTrip: 1.2,
} as const;

/** Peso por unidad de inventario (kg). Comida: 1 kg ≈ 3.000 kcal. */
export const WEIGHT: Record<string, number> = {
  agua: 1,
  aguaBruta: 1,
  diesel: 0.85,
  food: 1 / 3000,
  madera: 4,
  cemento: 25,
  sacos: 0.15,
  lejia_ml: 0.0011,
  gas: 0.4,
  mantas: 1.5,
  botiquin: 1,
  filtro_hepa: 1.5,
  libros_juegos: 1,
};
export const DEFAULT_WEIGHT = 0.3;

export const LOC_TYPES = Object.keys(LOCATIONS) as LocType[];
