/** Creación de una partida nueva a partir de una semilla. */
import { AIR, FALLOUT, GRID, THERMAL } from '../data/environment';
import { MORALE } from '../data/physiology';
import { CLIMATE, CLIMATE_VARIANTS, SECONDARY, SECONDARY_CHANCE, SECONDARY_PHASES, THREATS, THREAT_IDS, phaseLength } from '../data/threats';
import { Rng } from './rng';
import { generateMap } from './expedition';
import type { Bunker, CellKind, DayPlan, GameMode, GameState, ThreatId, ThreatState } from './types';

export const SAVE_VERSION = 2;

export const DEFAULT_PLAN: DayPlan = {
  morning: 'mantener',
  afternoon: 'ocio',
  night: 'dormir',
  food: 'completa',
  water: 'normal',
  fan: true,
  generator: 'auto',
  lights: true,
};

const rangeInt = (rng: Rng, [a, b]: [number, number]) => rng.int(a, b);

function makeBunker(rng: Rng): Bunker {
  const cols = GRID.cols;
  const rows = GRID.rows;
  const cells: CellKind[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let k: CellKind = 'tierra';
      if (r === 0) k = 'tierra';
      else if (r <= 2) k = rng.chance(0.15) ? 'arcilla' : 'tierra';
      else if (r <= 4) k = rng.chance(0.55) ? 'arcilla' : rng.chance(0.2) ? 'roca' : 'tierra';
      else k = rng.chance(0.65) ? 'roca' : 'arcilla';
      cells.push(k);
    }
  }
  const entryCol = Math.floor(cols / 2);
  cells[1 * cols + entryCol] = 'hueco'; // sótano existente de la casa
  return {
    cols,
    rows,
    cells,
    modules: [],
    coverCm: new Array(cols).fill(0),
    entryCol,
    interiorTempC: THERMAL.groundTempC + 2,
    co2ppm: AIR.outdoorPpm + 400,
    project: null,
    nextUid: 1,
    genRunning: false,
  };
}

function makeThreat(rng: Rng, primary: ThreatId, startH: number): { threat: ThreatState; budget: number } {
  const base = THREATS[primary];
  const variant = primary === 'clima' ? rng.pick(CLIMATE_VARIANTS) : undefined;
  const data = { ...base, ...(variant ? CLIMATE[variant] : {}) };
  const prepH = rangeInt(rng, data.prepH);
  const eventH = startH + prepH;
  const budget = Math.round(rng.range(data.budget[0], data.budget[1]) / 50) * 50;
  const fallout = primary === 'nuclear' ? [{ atH: eventH, r1: Math.round(rng.range(...FALLOUT.r1Range)) }] : [];
  const threat: ThreatState = {
    primary,
    variant,
    eventH,
    baseTempC: Math.round(rng.range(data.baseTempC[0], data.baseTempC[1])),
    fallout,
    infectionPressure: data.infectionPressure,
    looterPressure: data.looterPressure,
    gridUntilH: eventH + rangeInt(rng, data.gridDownAfterH),
    waterMainsUntilH: eventH + rangeInt(rng, data.waterMainsDownAfterH),
    mods: [],
  };
  if (rng.chance(SECONDARY_CHANCE)) {
    threat.secondary = SECONDARY[variant ?? primary];
    threat.secondaryFromPhase = rng.int(SECONDARY_PHASES[0], SECONDARY_PHASES[1]);
  }
  if (variant === 'inundacion') {
    // La crecida inicial: agua en los niveles más bajos durante 48 h.
    threat.mods.push({ fromH: eventH, toH: eventH + 48, kind: 'flood', value: 1 });
  }
  return { threat, budget };
}

export interface NewGameOptions {
  mode?: GameMode;
  threat?: ThreatId;
}

export function newGame(seed: string, opts: NewGameOptions = {}): GameState {
  const rng = Rng.fromSeed(seed);
  const primary = opts.threat ?? rng.pick(THREAT_IDS);
  const startClock = rng.int(7, 17);
  const { threat, budget } = makeThreat(rng, primary, 0);
  const bunker = makeBunker(rng);
  const map = generateMap(rng);

  const s: GameState = {
    v: SAVE_VERSION,
    seed,
    mode: opts.mode ?? 'normal',
    rng: rng.state(),
    stage: 'briefing',
    h: 0,
    startClock,
    phase: 0,
    phaseDay: 0,
    phaseLength: phaseLength(1),
    day: 0,
    threat,
    survivor: {
      health: 100,
      waterDeficitL: 0,
      kcalBalance: 0,
      doseMSv: 0,
      acuteDoseMSv: 0,
      coreTempC: 37,
      fatigue: 20,
      morale: MORALE.start,
      hygiene: 90,
      injuries: 0,
      infection: null,
      immuneTo: [],
      damageLog: {},
    },
    bunker,
    // Lo que ya hay en casa (simplificación): un poco de agua, comida de despensa, una manta.
    inv: { agua: 12, aguaBruta: 0, diesel: 0, mantas: 1, pilas: 1, filtroHoras: 0 },
    food: [
      { food: 'pasta', kcal: 3600, expiresH: 24 * 300 },
      { food: 'galletas', kcal: 1800, expiresH: 24 * 120 },
      { food: 'conserva_plato', kcal: 1350, expiresH: 24 * 600 },
      { food: 'fresco', kcal: 1200, expiresH: 24 * 4 },
    ],
    batteryWh: 0,
    money: budget,
    budget,
    plan: { ...DEFAULT_PLAN },
    excavatorUntilH: -1,
    excavatorFromH: -1,
    deliveries: [],
    bought: {},
    pending: null,
    delayed: [],
    eventsSeen: [],
    eventCooldown: 0,
    log: [],
    lastReport: null,
    stats: { daysSurvived: 0, expeditions: 0, eventsSeen: 0, bossesBeaten: 0, maxDoseMSv: 0, moneySpent: 0 },
    deathCause: null,
    noise24: 0,
    visibility: 0,
    tutorial: null,
    map,
    away: null,
    pendingEncounter: null,
    cardQueue: [],
    perks: [],
    perkOffer: null,
  };
  return s;
}
