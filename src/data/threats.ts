/**
 * Parámetros de cada amenaza. Rangos aleatorios [min, max] sorteados con la semilla.
 */
import type { ClimateVariant, ThreatId } from '../core/types';

export interface ThreatData {
  /** Margen de aviso antes del evento (h). */
  prepH: [number, number];
  budget: [number, number];
  baseTempC: [number, number];
  /** Horas tras el evento en que cae la red eléctrica (0 = inmediato). */
  gridDownAfterH: [number, number];
  waterMainsDownAfterH: [number, number];
  infectionPressure: number;
  looterPressure: number;
}

const TEMPLATE: Omit<ThreatData, 'prepH'> = {
  budget: [2000, 6000],
  baseTempC: [8, 20],
  gridDownAfterH: [0, 0],
  waterMainsDownAfterH: [6, 24],
  infectionPressure: 0.002,
  looterPressure: 0.15,
};

export const THREATS: Record<ThreatId, ThreatData> = {
  // Escalada diplomática: horas o pocos días de aviso. La red cae por daños y pánico.
  nuclear: { ...TEMPLATE, prepH: [8, 40], budget: [2500, 6000], looterPressure: 0.12 },
  // Una pandemia da días de margen; la red y el agua aguantan un tiempo (sorteado).
  pandemia: {
    ...TEMPLATE,
    prepH: [72, 200],
    budget: [2500, 6500],
    gridDownAfterH: [96, 480],
    waterMainsDownAfterH: [168, 720],
    infectionPressure: 0.03,
    looterPressure: 0.1,
  },
  // Apagón prolongado y colapso del orden: la red cae ya, el agua en horas.
  colapso: { ...TEMPLATE, prepH: [24, 96], budget: [1500, 5000], waterMainsDownAfterH: [4, 36], looterPressure: 0.45 },
  // Catástrofe climática: depende de la variante (ver CLIMATE).
  clima: { ...TEMPLATE, prepH: [24, 72], budget: [2000, 5500] },
};

export const CLIMATE: Record<ClimateVariant, Partial<ThreatData>> = {
  // Ola de frío extremo: avisos meteorológicos con 1-4 días.
  frio: { prepH: [24, 96], baseTempC: [-24, -12], gridDownAfterH: [0, 48], waterMainsDownAfterH: [8, 24], looterPressure: 0.12 },
  // Inundación: avisos de horas a 3 días; red y agua comprometidas.
  inundacion: { prepH: [12, 60], baseTempC: [6, 14], waterMainsDownAfterH: [0, 6], looterPressure: 0.18 },
  // Tormenta solar: una eyección de masa coronal tarda ~15 h a 3 días en llegar (noaa_swpc).
  tormenta_solar: { prepH: [15, 72], baseTempC: [4, 18], waterMainsDownAfterH: [12, 48], looterPressure: 0.3 },
};

export const THREAT_IDS: ThreatId[] = ['nuclear', 'pandemia', 'colapso', 'clima'];
export const CLIMATE_VARIANTS: ClimateVariant[] = ['frio', 'inundacion', 'tormenta_solar'];

/** Duración de cada fase en días. Se usa la última para fases posteriores (+5 por fase). */
export const PHASE_DAYS = [3, 5, 8, 12, 16, 20] as const;
export function phaseLength(phase: number): number {
  if (phase <= PHASE_DAYS.length) return PHASE_DAYS[phase - 1];
  return PHASE_DAYS[PHASE_DAYS.length - 1] + 5 * (phase - PHASE_DAYS.length);
}

/** Intensificación de la amenaza con cada fase (multiplica presiones). Simplificación. */
export function phasePressure(phase: number): number {
  return 1 + 0.25 * (phase - 1);
}

/** Tutorial: partida nuclear corta y moderada (valores fijos). */
export const TUTORIAL = { prepH: 24, budget: 4000, r1: 350, startClock: 9, phase1Days: 2 } as const;

/** Probabilidad de evento al final de cada día (si no hay crisis final). */
export const EVENT_CHANCE = 0.55;
export const EVENT_COOLDOWN_DAYS = 0;

/** Puntuación. */
export const SCORE = {
  perDay: 10,
  perPhase: 100,
  perBoss: 50,
  lowDoseBonus: 50, // terminar con < 100 mSv en amenaza nuclear
} as const;

/**
 * Amenaza secundaria encadenada con lógica causal. Aparece a partir de la fase 3 o 4.
 * nuclear → colapso del orden; pandemia → colapso; colapso → epidemia por falta de saneamiento;
 * frío y tormenta solar → apagón prolongado y saqueos; inundación → epidemia de origen hídrico.
 */
export const SECONDARY: Record<string, ThreatId> = {
  nuclear: 'colapso',
  pandemia: 'colapso',
  colapso: 'pandemia',
  frio: 'colapso',
  tormenta_solar: 'colapso',
  inundacion: 'pandemia',
};
export const SECONDARY_CHANCE = 0.75;
export const SECONDARY_PHASES: [number, number] = [3, 4];
