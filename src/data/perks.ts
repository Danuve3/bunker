/**
 * Perks entre fases (se elige 1 de 3). Son modificadores sobre los sistemas, nunca sobre
 * la física (la radiación no se "aguanta mejor" por voluntad). Varios tienen contrapartida.
 */
import type { EffectSpec, ThreatId } from '../core/types';

export interface PerkMods {
  waterNeedMult: number;
  kcalSpendMult: number;
  fatigueGainMult: number;
  sleepMult: number;
  moraleDailyAdd: number;
  ocioMult: number;
  radioMoraleAdd: number;
  repairMult: number;
  buildMult: number;
  digMult: number;
  potabilizeMult: number;
  manualVentMult: number;
  healMult: number;
  infectionMult: number;
  gastroMult: number;
  hygieneDrainMult: number;
  injuryMult: number;
  coldComfortAdd: number;
  looterMult: number;
  doorAdd: number;
  noiseMult: number;
  fuelMult: number;
  genWearMult: number;
  gasMult: number;
  travelMult: number;
  carryKgAdd: number;
  lootMult: number;
  encounterMult: number;
  noHungerMorale: boolean;
  seeDose: boolean;
  seeCo2: boolean;
}

export const NO_MODS: PerkMods = {
  waterNeedMult: 1,
  kcalSpendMult: 1,
  fatigueGainMult: 1,
  sleepMult: 1,
  moraleDailyAdd: 0,
  ocioMult: 1,
  radioMoraleAdd: 0,
  repairMult: 1,
  buildMult: 1,
  digMult: 1,
  potabilizeMult: 1,
  manualVentMult: 1,
  healMult: 1,
  infectionMult: 1,
  gastroMult: 1,
  hygieneDrainMult: 1,
  injuryMult: 1,
  coldComfortAdd: 0,
  looterMult: 1,
  doorAdd: 0,
  noiseMult: 1,
  fuelMult: 1,
  genWearMult: 1,
  gasMult: 1,
  travelMult: 1,
  carryKgAdd: 0,
  lootMult: 1,
  encounterMult: 1,
  noHungerMorale: false,
  seeDose: false,
  seeCo2: false,
};

export interface PerkData {
  mods: Partial<PerkMods>;
  onPick?: EffectSpec[];
  /** Más probable en estas amenazas (peso ×2). */
  threats?: ThreatId[];
}

export const PERKS: Record<string, PerkData> = {
  fontanero: { mods: { potabilizeMult: 1.6, hygieneDrainMult: 0.85 } },
  estomago_hierro: { mods: { gastroMult: 0.4 } },
  insomne: { mods: { fatigueGainMult: 0.75, moraleDailyAdd: -1.5 } },
  radioaficionado: { mods: { radioMoraleAdd: 4 }, onPick: [{ k: 'inv', id: 'radio_dinamo', n: 1 }] },
  racionador: { mods: { kcalSpendMult: 0.93, noHungerMorale: true } },
  manitas: { mods: { repairMult: 1.5, buildMult: 1.25 } },
  topo: { mods: { digMult: 1.7, fatigueGainMult: 1.05 } },
  pulmones: { mods: { manualVentMult: 1.6 } },
  corredor: { mods: { travelMult: 1.35, encounterMult: 0.85 } },
  mula: { mods: { carryKgAdd: 12, fatigueGainMult: 1.06 } },
  sigiloso: { mods: { encounterMult: 0.6, looterMult: 0.85 }, threats: ['colapso'] },
  carronero: { mods: { lootMult: 1.3, injuryMult: 1.25 } },
  enfermero: { mods: { healMult: 1.6 }, threats: ['pandemia'] },
  inmune: { mods: { infectionMult: 0.6 }, threats: ['pandemia'] },
  piel_dura: { mods: { injuryMult: 0.6 } },
  sangre_fria: { mods: { coldComfortAdd: 4, kcalSpendMult: 1.05 }, threats: ['clima'] },
  asceta: { mods: { moraleDailyAdd: 1, ocioMult: 0.6, kcalSpendMult: 0.97 } },
  optimista: { mods: { moraleDailyAdd: 2 } },
  solitario: { mods: { moraleDailyAdd: 3, ocioMult: 0.8, encounterMult: 1.1 } },
  dormilon: { mods: { sleepMult: 1.3, kcalSpendMult: 1.02 } },
  mecanico: { mods: { fuelMult: 0.8, genWearMult: 0.6 } },
  silenciador: { mods: { noiseMult: 0.5 }, threats: ['colapso'] },
  vigilante: { mods: { looterMult: 0.7, doorAdd: 0.1 }, threats: ['colapso'] },
  cocinero: { mods: { gasMult: 0.6, moraleDailyAdd: 0.5 } },
  higienista: { mods: { hygieneDrainMult: 0.6, gastroMult: 0.7, infectionMult: 0.9 } },
  lector: { mods: { ocioMult: 1.5 } },
  metabolismo_lento: { mods: { kcalSpendMult: 0.88, fatigueGainMult: 1.1 } },
  camello: { mods: { waterNeedMult: 0.85, coldComfortAdd: -1 } },
  temerario: { mods: { lootMult: 1.2, encounterMult: 1.25, injuryMult: 0.9 } },
  alijo: { mods: {}, onPick: [{ k: 'water', n: 20 }, { k: 'food', kcal: 6000, food: 'liofilizada' }, { k: 'inv', id: 'botiquin', n: 1 }] },
  madrugador: { mods: { buildMult: 1.15, repairMult: 1.15, sleepMult: 0.95 } },
  hogareno: { mods: { moraleDailyAdd: 1.5, travelMult: 0.85 } },
  ojo_clinico: { mods: { seeDose: true }, threats: ['nuclear'] },
  olfato: { mods: { seeCo2: true, manualVentMult: 1.15 } },
};

export const PERK_IDS = Object.keys(PERKS);
export const PERK_OFFER = 3;
