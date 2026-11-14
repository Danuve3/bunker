/**
 * Cartas: eventos con decisiones y crisis finales de fase.
 * Solo números y efectos; los textos viven en i18n (es-content.ts) con el mismo id.
 */
import type { ClimateVariant, EffectSpec, ModuleType, ThreatId } from '../core/types';
import type { SourceId } from './sources';

export interface CardCond {
  hasModule?: ModuleType;
  lacksModule?: ModuleType;
  hasItem?: string;
  minCo2?: number;
  maxMorale?: number;
  minFood?: number; // kcal en despensa
  gridUp?: boolean;
}

export interface CardChoice {
  id: string;
  requires?: Record<string, number>; // se consume al elegir
  requiresModule?: ModuleType;
  effects: EffectSpec[];
}

export interface CardData {
  id: string;
  kind: 'event' | 'boss';
  threats?: ThreatId[]; // sin definir = genérica
  variants?: ClimateVariant[];
  minDay?: number;
  minPhase?: number;
  weight?: number;
  cond?: CardCond;
  /** Efectos al aparecer (antes de decidir). */
  base?: EffectSpec[];
  choices: CardChoice[];
  fact?: SourceId;
}

// ─── Crisis finales de fase ("jefes") ────────────────────────────────────────
export const BOSSES: CardData[] = [
  {
    id: 'boss_lluvia_negra',
    kind: 'boss',
    threats: ['nuclear'],
    base: [{ k: 'fallout', r1Mult: 0.35 }],
    choices: [
      { id: 'sellar', requires: { plastico_cinta: 1 }, effects: [{ k: 'mod', kind: 'leakMult', value: 0.25, hours: 24 }, { k: 'mod', kind: 'fanOff', value: 1, hours: 24 }] },
      { id: 'reforzar', requires: { sacos: 36 }, effects: [{ k: 'cover', cm: 10 }, { k: 'stat', stat: 'fatigue', n: 20 }] },
      { id: 'rutina', effects: [{ k: 'stat', stat: 'morale', n: -3 }] },
    ],
    fact: 'glasstone',
  },
  {
    id: 'boss_brote',
    kind: 'boss',
    threats: ['pandemia'],
    base: [{ k: 'mod', kind: 'infection', value: 0.05, hours: 48 }],
    choices: [
      { id: 'sellar', requires: { plastico_cinta: 1 }, effects: [{ k: 'mod', kind: 'leakMult', value: 0.3, hours: 48 }, { k: 'mod', kind: 'infection', value: -0.035, hours: 48 }] },
      { id: 'mascarilla', requires: { ffp2: 4 }, effects: [{ k: 'mod', kind: 'masks', value: 1, hours: 48 }] },
      { id: 'confiar', effects: [] },
    ],
    fact: 'niosh_n95',
  },
  {
    id: 'boss_asalto',
    kind: 'boss',
    threats: ['colapso'],
    choices: [
      { id: 'esconderse', effects: [{ k: 'special', id: 'assault_hide' }] },
      { id: 'negociar', effects: [{ k: 'foodLossPct', pct: 25 }, { k: 'water', n: -20 }, { k: 'stat', stat: 'morale', n: -6 }] },
      { id: 'resistir', effects: [{ k: 'special', id: 'assault_resist' }] },
    ],
  },
  {
    id: 'boss_ola_frio',
    kind: 'boss',
    threats: ['clima'],
    variants: ['frio'],
    base: [{ k: 'mod', kind: 'tempOffset', value: -14, hours: 72 }],
    choices: [
      { id: 'acurrucarse', effects: [{ k: 'mod', kind: 'huddle', value: 5, hours: 72 }, { k: 'stat', stat: 'morale', n: -4 }] },
      { id: 'estufa', requires: { madera: 4 }, effects: [{ k: 'mod', kind: 'tempOffset', value: 8, hours: 24 }, { k: 'special', id: 'co_risk' }] },
      { id: 'aguantar', effects: [] },
    ],
    fact: 'niosh_cold',
  },
  {
    id: 'boss_crecida',
    kind: 'boss',
    threats: ['clima'],
    variants: ['inundacion'],
    choices: [
      { id: 'achicar', effects: [{ k: 'stat', stat: 'fatigue', n: 35 }, { k: 'special', id: 'flood_bail' }] },
      { id: 'sacos', requires: { sacos: 25 }, effects: [{ k: 'stat', stat: 'fatigue', n: 15 }] },
      { id: 'subir', effects: [{ k: 'stat', stat: 'fatigue', n: 20 }, { k: 'special', id: 'flood' }] },
    ],
  },
  {
    id: 'boss_tormenta_g5',
    kind: 'boss',
    threats: ['clima'],
    variants: ['tormenta_solar'],
    choices: [
      { id: 'desconectar', effects: [{ k: 'mod', kind: 'noPower', value: 1, hours: 24 }, { k: 'stat', stat: 'fatigue', n: 8 }] },
      { id: 'mantener', effects: [{ k: 'special', id: 'storm_electronics' }] },
    ],
    fact: 'noaa_swpc',
  },
];

// ─── Eventos (pool inicial; se amplía en el hito 4) ──────────────────────────
export const EVENTS: CardData[] = [
  {
    id: 'ev_golpes',
    kind: 'event',
    choices: [
      { id: 'quieto', effects: [{ k: 'stat', stat: 'fatigue', n: 8 }, { k: 'stat', stat: 'morale', n: -5 }] },
      { id: 'musica', effects: [{ k: 'stat', stat: 'morale', n: 2 }, { k: 'chance', p: 0.3, then: [{ k: 'mod', kind: 'looters', value: 0.2, hours: 48 }] }] },
    ],
  },
  {
    id: 'ev_gotera',
    kind: 'event',
    choices: [
      { id: 'reparar', requires: { cemento: 1 }, effects: [{ k: 'stat', stat: 'fatigue', n: 6 }, { k: 'stat', stat: 'morale', n: 2 }] },
      {
        id: 'ignorar',
        effects: [{ k: 'delay', hours: 48, text: 'ev_gotera_tarde', effects: [{ k: 'stat', stat: 'morale', n: -5 }, { k: 'wear', n: 0.15 }, { k: 'rawWater', n: 10 }] }],
      },
    ],
  },
  {
    id: 'ev_latas',
    kind: 'event',
    minDay: 2,
    cond: { minFood: 3000 },
    choices: [
      { id: 'tirar', effects: [{ k: 'foodLossPct', pct: 4 }] },
      { id: 'comer', effects: [{ k: 'chance', p: 0.3, then: [{ k: 'infect', kind: 'gastro', p: 1 }, { k: 'stat', stat: 'health', n: -10 }], textThen: 'ev_latas_mal', textElse: 'ev_latas_bien' }] },
    ],
    fact: 'cdc_botulism',
  },
  {
    id: 'ev_insomnio',
    kind: 'event',
    minDay: 2,
    choices: [
      { id: 'contar', effects: [{ k: 'stat', stat: 'fatigue', n: 10 }] },
      { id: 'diario', effects: [{ k: 'stat', stat: 'morale', n: 6 }, { k: 'stat', stat: 'fatigue', n: 4 }] },
      { id: 'pastilla', requires: { analgesicos: 1 }, effects: [{ k: 'stat', stat: 'fatigue', n: -6 }] },
    ],
  },
  {
    id: 'ev_raton',
    kind: 'event',
    minDay: 2,
    cond: { minFood: 5000, lacksModule: 'despensa' },
    choices: [
      { id: 'trampa', requires: { madera: 1 }, effects: [{ k: 'foodLossPct', pct: 2 }] },
      { id: 'nada', effects: [{ k: 'foodLossPct', pct: 8 }, { k: 'chance', p: 0.2, then: [{ k: 'infect', kind: 'gastro', p: 1 }] }] },
    ],
  },
  {
    id: 'ev_co2',
    kind: 'event',
    cond: { minCo2: 4500 },
    choices: [
      { id: 'ventilar', effects: [{ k: 'stat', stat: 'fatigue', n: 15 }, { k: 'co2', ppm: -3000 }] },
      { id: 'aguantar', effects: [{ k: 'stat', stat: 'morale', n: -5 }, { k: 'stat', stat: 'health', n: -3 }] },
    ],
    fact: 'niosh_co2',
  },
  {
    id: 'ev_radio_voz',
    kind: 'event',
    cond: { hasItem: 'radio_dinamo' },
    choices: [
      { id: 'escuchar', effects: [{ k: 'chance', p: 0.5, then: [{ k: 'stat', stat: 'morale', n: 8 }], else: [{ k: 'stat', stat: 'morale', n: -6 }], textThen: 'ev_radio_voz_bien', textElse: 'ev_radio_voz_mal' }] },
      { id: 'apagar', effects: [{ k: 'stat', stat: 'morale', n: -1 }] },
    ],
  },
  {
    id: 'ev_salir_ya',
    kind: 'event',
    threats: ['nuclear'],
    choices: [
      { id: 'asomarse', effects: [{ k: 'special', id: 'peek' }, { k: 'stat', stat: 'morale', n: 4 }] },
      { id: 'quedarse', effects: [{ k: 'stat', stat: 'morale', n: -2 }] },
    ],
    fact: 'fema_nuclear',
  },
  {
    id: 'ev_vecino_tos',
    kind: 'event',
    threats: ['pandemia'],
    choices: [
      { id: 'rendija', requires: { analgesicos: 1, ffp2: 1 }, effects: [{ k: 'stat', stat: 'morale', n: 8 }, { k: 'infect', kind: 'pandemia', p: 0.04 }] },
      { id: 'no_abrir', effects: [{ k: 'stat', stat: 'morale', n: -7 }] },
      { id: 'abrir', effects: [{ k: 'stat', stat: 'morale', n: 6 }, { k: 'infect', kind: 'pandemia', p: 0.45 }] },
    ],
    fact: 'niosh_n95',
  },
  {
    id: 'ev_linterna',
    kind: 'event',
    threats: ['colapso', 'clima'],
    choices: [
      { id: 'apagar', effects: [{ k: 'stat', stat: 'fatigue', n: 3 }, { k: 'mod', kind: 'looters', value: -0.1, hours: 48 }] },
      { id: 'mirar', effects: [{ k: 'chance', p: 0.4, then: [{ k: 'mod', kind: 'looters', value: 0.25, hours: 72 }], textThen: 'ev_linterna_visto', textElse: 'ev_linterna_pasa' }] },
    ],
  },
  {
    id: 'ev_tuberia',
    kind: 'event',
    threats: ['clima'],
    variants: ['frio'],
    choices: [
      { id: 'envolver', requires: { mantas: 1 }, effects: [{ k: 'stat', stat: 'morale', n: 2 }] },
      { id: 'dejar', effects: [{ k: 'water', n: -25 }, { k: 'rawWater', n: 10 }] },
    ],
    fact: 'niosh_cold',
  },
  {
    id: 'ev_recuerdo',
    kind: 'event',
    choices: [
      { id: 'foto', effects: [{ k: 'stat', stat: 'morale', n: 5 }] },
      { id: 'guardar', effects: [{ k: 'stat', stat: 'morale', n: -2 }, { k: 'stat', stat: 'fatigue', n: -4 }] },
    ],
  },
];

export const ALL_CARDS: Record<string, CardData> = Object.fromEntries([...BOSSES, ...EVENTS].map((c) => [c.id, c]));
