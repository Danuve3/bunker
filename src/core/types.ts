/**
 * Modelo de datos del estado de partida.
 * Todo es JSON plano (sin Map/Set/clases) para poder serializarlo,
 * clonarlo con structuredClone y compararlo en los tests de determinismo.
 */
import type { RngState } from './rng';

export type ThreatId = 'nuclear' | 'pandemia' | 'colapso' | 'clima';
export type ClimateVariant = 'frio' | 'inundacion' | 'tormenta_solar';
export type GameMode = 'normal' | 'diaria' | 'tutorial';

export type Stage =
  | 'briefing' // anuncio de la amenaza
  | 'prep' // fase 0
  | 'crisis' // planificando un día
  | 'event' // carta de evento pendiente
  | 'boss' // crisis final de fase pendiente de decisión
  | 'phaseEnd' // resumen entre fases
  | 'dead';

export type CellKind = 'tierra' | 'arcilla' | 'roca' | 'hueco';

export type ModuleType =
  | 'dormitorio'
  | 'despensa'
  | 'deposito_agua'
  | 'generador'
  | 'baterias'
  | 'ventilacion'
  | 'letrina'
  | 'enfermeria'
  | 'taller'
  | 'hidroponico'
  | 'radio'
  | 'esclusa'
  | 'puerta_blindada'
  | 'periscopio'
  | 'ocio'
  | 'purificador';

export interface ModuleInst {
  uid: number;
  type: ModuleType;
  c: number;
  r: number;
  /** 0..1: desgaste. Por debajo de 0,25 puede averiarse. */
  condition: number;
  broken: boolean;
  /** Días de crecimiento (hidropónico). */
  growth?: number;
}

export type ProjectKind = 'excavar' | 'construir' | 'cubrir';

export interface Project {
  kind: ProjectKind;
  c: number;
  r: number;
  module?: ModuleType;
  hoursLeft: number;
  hoursTotal: number;
}

export interface Bunker {
  cols: number;
  rows: number;
  /** Fila 0 = superficie; filas 1..rows-1 bajo tierra. Índice = r * cols + c. */
  cells: CellKind[];
  modules: ModuleInst[];
  /** Cobertura extra en superficie por columna (cm de tierra en sacos terreros). */
  coverCm: number[];
  /** Columna del acceso desde la casa. */
  entryCol: number;
  interiorTempC: number;
  co2ppm: number;
  project: Project | null;
  nextUid: number;
  genRunning: boolean;
}

export interface FoodBatch {
  food: string; // id de data/items
  kcal: number;
  expiresH: number; // hora absoluta de caducidad
}

export type InfectionKind = 'gastro' | 'herida' | 'respiratoria' | 'pandemia';

export interface Infection {
  kind: InfectionKind;
  stage: 'incubando' | 'activa';
  /** Horas restantes de la etapa actual. */
  hoursLeft: number;
  /** Duración total de la etapa activa (para la curva de gravedad). */
  activeTotal: number;
  /** Pico de gravedad 0..100 (lo reducen los cuidados). */
  peak: number;
  severity: number;
}

export type DeathCause =
  | 'deshidratacion'
  | 'inanicion'
  | 'radiacion'
  | 'hipotermia'
  | 'infeccion'
  | 'heridas'
  | 'asfixia';

export interface Survivor {
  health: number; // 0..100
  waterDeficitL: number; // ≥ 0
  kcalBalance: number; // < 0 = déficit acumulado (reservas corporales)
  doseMSv: number; // dosis total acumulada
  /** Dosis "aguda" con reparación biológica; es la que provoca el SIA. */
  acuteDoseMSv: number;
  coreTempC: number;
  fatigue: number; // 0..100
  morale: number; // 0..100
  hygiene: number; // 0..100
  injuries: number; // 0..100
  infection: Infection | null;
  immuneTo: InfectionKind[];
  /** Daño acumulado por causa en las últimas horas (para atribuir la muerte). */
  damageLog: Partial<Record<DeathCause, number>>;
}

/** Modificador temporal del entorno (amenaza, crisis final, eventos). */
export interface EnvMod {
  fromH: number;
  toH: number;
  kind: 'tempOffset' | 'infection' | 'looters' | 'flood' | 'leakMult' | 'noGrid' | 'masks' | 'huddle' | 'noPower' | 'fanOff';
  value: number;
}

/** Fuente de lluvia radiactiva: tasa a H+1 desde su propio instante (ley t^-1.2). */
export interface FalloutSource {
  atH: number;
  r1: number; // mSv/h a la intemperie, 1 h después de atH
}

export interface ThreatState {
  primary: ThreatId;
  variant?: ClimateVariant;
  secondary?: ThreatId;
  secondaryFromPhase?: number;
  /** Hora absoluta del evento (fin de la fase 0). */
  eventH: number;
  baseTempC: number;
  fallout: FalloutSource[];
  /** Presión de contagio exterior (prob./h de exposición sin protección). */
  infectionPressure: number;
  /** Presión de saqueadores (0..1). */
  looterPressure: number;
  /** Hora absoluta a la que cae la red eléctrica (Infinity = nunca, null = ya). */
  gridUntilH: number;
  waterMainsUntilH: number;
  mods: EnvMod[];
}

export type DayActivity =
  | 'expedicion'
  | 'descansar'
  | 'mantener'
  | 'ventilar'
  | 'construir'
  | 'ocio'
  | 'radio'
  | 'curar'
  | 'potabilizar'
  | 'vigilar';

export type NightActivity = 'dormir' | 'guardia';

export type FoodRation = 'completa' | 'reducida' | 'minima';
export type WaterRation = 'normal' | 'reducida' | 'minima';
export type GenMode = 'off' | 'auto' | 'on';

export type LootFocus = 'agua' | 'comida' | 'medicina' | 'materiales' | 'combustible';

export interface ExpPlan {
  loc: string;
  focus: LootFocus;
}

export interface Location {
  id: string;
  type: string; // LocType
  variant: number; // nombre alternativo (i18n)
  distKm: number;
  angle: number; // radianes, para el mapa
  looted: number; // 0..1
  visits: number;
}

export interface Away {
  loc: string;
  masked: boolean;
}

export interface DayPlan {
  exp?: { morning?: ExpPlan; afternoon?: ExpPlan };
  morning: DayActivity;
  afternoon: DayActivity;
  night: NightActivity;
  food: FoodRation;
  water: WaterRation;
  fan: boolean;
  generator: GenMode;
  lights: boolean;
}

export type EffectSpec =
  | { k: 'inv'; id: string; n: number }
  | { k: 'water'; n: number }
  | { k: 'rawWater'; n: number }
  | { k: 'fuel'; n: number }
  | { k: 'food'; kcal: number; food?: string }
  | { k: 'foodLossPct'; pct: number }
  | { k: 'stat'; stat: 'health' | 'morale' | 'fatigue' | 'hygiene' | 'injuries'; n: number }
  | { k: 'dose'; mSv: number }
  | { k: 'co2'; ppm: number }
  | { k: 'infect'; kind: InfectionKind; p: number }
  | { k: 'mod'; kind: EnvMod['kind']; value: number; hours: number }
  | { k: 'fallout'; r1Mult: number }
  | { k: 'breakModule'; type?: ModuleType }
  | { k: 'wear'; type?: ModuleType; n: number }
  | { k: 'chance'; p: number; then: EffectSpec[]; else?: EffectSpec[]; textThen?: string; textElse?: string }
  | { k: 'delay'; hours: number; effects: EffectSpec[]; text?: string }
  | { k: 'log'; key: string }
  | { k: 'cover'; cm: number }
  | { k: 'special'; id: SpecialEffect };

export type SpecialEffect = 'robbed' | 'peek' | 'assault_hide' | 'assault_resist' | 'flood' | 'flood_bail' | 'storm_electronics' | 'co_risk';

export interface DelayedEffect {
  atH: number;
  effects: EffectSpec[];
  text?: string;
}

export interface PendingCard {
  id: string; // id de evento o de crisis final
  kind: 'event' | 'boss';
}

/** Entrada del diario. `key` es una clave de i18n (log.*) y `p` sus parámetros. */
export interface LogEntry {
  h: number;
  key: string;
  p?: Record<string, string | number>;
  tone?: 'info' | 'good' | 'warn' | 'bad';
}

export interface RunStats {
  daysSurvived: number;
  expeditions: number;
  eventsSeen: number;
  bossesBeaten: number;
  maxDoseMSv: number;
  moneySpent: number;
}

export interface Delivery {
  atH: number;
  item: string;
  qty: number;
}

export interface GameState {
  v: number;
  seed: string;
  mode: GameMode;
  rng: RngState;
  stage: Stage;
  /** Horas transcurridas desde el inicio de la partida. */
  h: number;
  /** Hora del día (0..23) en h = 0. */
  startClock: number;
  phase: number; // 0 = preparación
  phaseDay: number; // día dentro de la fase (1..phaseLength)
  phaseLength: number;
  day: number; // días de crisis completados
  threat: ThreatState;
  survivor: Survivor;
  bunker: Bunker;
  /** Inventario contable: agua, combustible, objetos, materiales (por id de data/items). */
  inv: Record<string, number>;
  food: FoodBatch[];
  batteryWh: number;
  money: number;
  budget: number;
  plan: DayPlan;
  /** Excavadora alquilada disponible hasta esta hora absoluta. */
  excavatorUntilH: number;
  excavatorFromH: number;
  deliveries: Delivery[];
  /** Unidades compradas por artículo (para calcular existencias restantes). */
  bought: Record<string, number>;
  pending: PendingCard | null;
  delayed: DelayedEffect[];
  eventsSeen: string[];
  eventCooldown: number;
  log: LogEntry[];
  /** Resumen del último día simulado (para el informe en pantalla). */
  lastReport: DayReport | null;
  stats: RunStats;
  deathCause: DeathCause | null;
  /** Ruido generado en las últimas 24 h (atrae saqueadores). */
  noise24: number;
  /** Visibilidad acumulada (luces de noche, salidas): decae con el tiempo. */
  visibility: number;
  tutorial: { step: number; done: boolean } | null;
  map: Location[];
  /** Fuera del búnker (expedición en curso durante la simulación). */
  away: Away | null;
  /** Encuentro pendiente de mostrar al final del día. */
  pendingEncounter: string | null;
  /** Cartas que se mostrarán después de la actual. */
  cardQueue: string[];
}

export interface DayReport {
  fromH: number;
  toH: number;
  waterUsedL: number;
  kcalEaten: number;
  kcalSpent: number;
  doseMSv: number;
  fuelUsedL: number;
  energyUsedWh: number;
  co2Max: number;
  tempMin: number;
  hoursDark: number;
  hoursHighCo2: number;
  hoursCold: number;
  hoursUnpowered: number;
  notes: LogEntry[];
}
