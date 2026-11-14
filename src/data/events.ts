/**
 * Pool ampliado de eventos y crisis finales (hito 4). Solo efectos y condiciones;
 * los textos están en i18n/es-events.ts con el mismo id.
 */
import type { CardData } from './cards';

const ev = (c: Omit<CardData, 'kind'>): CardData => ({ kind: 'event', ...c });
const boss = (c: Omit<CardData, 'kind'>): CardData => ({ kind: 'boss', ...c });

// ─── Genéricos ───────────────────────────────────────────────────────────────
export const GENERIC_EVENTS: CardData[] = [
  ev({
    id: 'ev_gen_humo', cond: { hasModule: 'generador' }, fact: 'cdc_co',
    choices: [
      { id: 'revisar', effects: [{ k: 'stat', stat: 'fatigue', n: 10 }, { k: 'wear', type: 'generador', n: -0.25 }] },
      { id: 'seguir', effects: [{ k: 'chance', p: 0.45, then: [{ k: 'breakModule', type: 'generador' }], textThen: 'ev_gen_humo_rompe', textElse: 'ev_gen_humo_aguanta' }] },
    ],
  }),
  ev({
    id: 'ev_bateria_hinchada', cond: { hasModule: 'baterias' },
    choices: [
      { id: 'desconectar', effects: [{ k: 'wear', type: 'baterias', n: 0.3 }, { k: 'stat', stat: 'fatigue', n: 5 }] },
      { id: 'vigilar', effects: [{ k: 'chance', p: 0.3, then: [{ k: 'breakModule', type: 'baterias' }, { k: 'stat', stat: 'injuries', n: 8 }], textThen: 'ev_bateria_revienta' }] },
    ],
  }),
  ev({
    id: 'ev_filtro_silba', cond: { hasModule: 'ventilacion' }, fact: 'doe_hepa',
    choices: [
      { id: 'cambiar', requires: { filtro_hepa: 1 }, effects: [{ k: 'inv', id: 'filtroHoras', n: 720 }] },
      { id: 'limpiar', effects: [{ k: 'stat', stat: 'fatigue', n: 8 }, { k: 'wear', type: 'ventilacion', n: 0.2 }] },
    ],
  }),
  ev({
    id: 'ev_moho', minDay: 4, fact: 'who_damp',
    choices: [
      { id: 'lejia', requires: { lejia_ml: 200 }, effects: [{ k: 'stat', stat: 'fatigue', n: 6 }, { k: 'stat', stat: 'hygiene', n: 5 }] },
      { id: 'ignorar', effects: [{ k: 'delay', hours: 72, text: 'ev_moho_tarde', effects: [{ k: 'infect', kind: 'respiratoria', p: 0.45 }, { k: 'stat', stat: 'morale', n: -4 }] }] },
    ],
  }),
  ev({
    id: 'ev_pesadilla', cond: { maxMorale: 60 },
    choices: [
      { id: 'escribir', effects: [{ k: 'stat', stat: 'morale', n: 5 }, { k: 'stat', stat: 'fatigue', n: 6 }] },
      { id: 'quieto', effects: [{ k: 'stat', stat: 'fatigue', n: 10 }, { k: 'stat', stat: 'morale', n: -2 }] },
    ],
  }),
  ev({
    id: 'ev_cumple', minDay: 3, weight: 0.5,
    choices: [
      { id: 'celebrar', requires: { _kcal: 800 }, effects: [{ k: 'food', kcal: -800 }, { k: 'stat', stat: 'morale', n: 12 }] },
      { id: 'nada', effects: [{ k: 'stat', stat: 'morale', n: -5 }] },
    ],
  }),
  ev({
    id: 'ev_muela', minDay: 3,
    choices: [
      { id: 'pastilla', requires: { analgesicos: 1 }, effects: [{ k: 'stat', stat: 'morale', n: 2 }] },
      { id: 'aguantar', effects: [{ k: 'stat', stat: 'morale', n: -7 }, { k: 'stat', stat: 'fatigue', n: 8 }] },
      { id: 'sacar', effects: [{ k: 'stat', stat: 'injuries', n: 10 }, { k: 'stat', stat: 'morale', n: -2 }, { k: 'infect', kind: 'herida', p: 0.25 }] },
    ],
  }),
  ev({
    id: 'ev_tobillo',
    base: [{ k: 'stat', stat: 'injuries', n: 12 }],
    choices: [
      { id: 'tablilla', requires: { madera: 1 }, effects: [{ k: 'stat', stat: 'injuries', n: -6 }] },
      { id: 'seguir', effects: [{ k: 'stat', stat: 'injuries', n: 6 }] },
    ],
  }),
  ev({
    id: 'ev_cable', cond: { hasModule: 'ventilacion', lacksModule: 'despensa' },
    choices: [
      { id: 'reparar', requires: { plastico_cinta: 1 }, effects: [{ k: 'stat', stat: 'fatigue', n: 4 }] },
      { id: 'dejar', effects: [{ k: 'breakModule', type: 'ventilacion' }] },
    ],
  }),
  ev({
    id: 'ev_bidon_olvidado', weight: 0.6,
    choices: [{ id: 'coger', effects: [{ k: 'water', n: 12 }, { k: 'stat', stat: 'morale', n: 4 }] }],
  }),
  ev({
    id: 'ev_silencio', minDay: 2,
    choices: [
      { id: 'hablar', effects: [{ k: 'stat', stat: 'morale', n: 4 }] },
      { id: 'respirar', effects: [{ k: 'stat', stat: 'fatigue', n: -6 }, { k: 'stat', stat: 'morale', n: 2 }] },
    ],
  }),
  ev({
    id: 'ev_condensacion', cond: { minCo2: 2500 },
    choices: [
      { id: 'ventilar', effects: [{ k: 'stat', stat: 'fatigue', n: 10 }, { k: 'co2', ppm: -2000 }] },
      { id: 'trapos', effects: [{ k: 'stat', stat: 'hygiene', n: -6 }] },
    ],
  }),
  ev({
    id: 'ev_marcas', minDay: 5,
    choices: [
      { id: 'contar', effects: [{ k: 'stat', stat: 'morale', n: 3 }] },
      { id: 'borrar', effects: [{ k: 'stat', stat: 'morale', n: -3 }, { k: 'stat', stat: 'fatigue', n: -4 }] },
    ],
  }),
  ev({
    id: 'ev_cucarachas', minDay: 3, cond: { minFood: 3000 },
    choices: [
      { id: 'lejia', requires: { lejia_ml: 100 }, effects: [{ k: 'foodLossPct', pct: 1 }] },
      { id: 'ignorar', effects: [{ k: 'foodLossPct', pct: 5 }, { k: 'infect', kind: 'gastro', p: 0.25 }] },
    ],
  }),
  ev({
    id: 'ev_cae_tierra',
    choices: [
      { id: 'apuntalar', requires: { madera: 2 }, effects: [{ k: 'stat', stat: 'fatigue', n: 8 }] },
      { id: 'dejar', effects: [{ k: 'delay', hours: 48, text: 'ev_cae_tierra_tarde', effects: [{ k: 'wear', n: 0.12 }, { k: 'chance', p: 0.4, then: [{ k: 'stat', stat: 'injuries', n: 15 }] }] }] },
    ],
  }),
  ev({
    id: 'ev_agua_rara', fact: 'cdc_water',
    choices: [
      { id: 'hervir', requires: { gas: 1 }, effects: [{ k: 'stat', stat: 'fatigue', n: 3 }] },
      { id: 'tirar', effects: [{ k: 'water', n: -10 }] },
      { id: 'beber', effects: [{ k: 'infect', kind: 'gastro', p: 0.4 }] },
    ],
  }),
  ev({
    id: 'ev_carta', minDay: 4,
    choices: [
      { id: 'escribir', effects: [{ k: 'stat', stat: 'morale', n: 7 }] },
      { id: 'romper', effects: [{ k: 'stat', stat: 'morale', n: -2 }] },
    ],
  }),
  ev({
    id: 'ev_escalofrios', minDay: 2,
    base: [{ k: 'infect', kind: 'respiratoria', p: 0.5 }],
    choices: [
      { id: 'reposo', effects: [{ k: 'stat', stat: 'fatigue', n: -10 }, { k: 'stat', stat: 'morale', n: -2 }] },
      { id: 'pastilla', requires: { analgesicos: 1 }, effects: [{ k: 'stat', stat: 'morale', n: 2 }] },
    ],
  }),
  ev({
    id: 'ev_reloj', minDay: 6,
    choices: [
      { id: 'calendario', effects: [{ k: 'stat', stat: 'morale', n: 3 }] },
      { id: 'olvidar', effects: [{ k: 'stat', stat: 'morale', n: -3 }, { k: 'stat', stat: 'fatigue', n: -3 }] },
    ],
  }),
  ev({
    id: 'ev_mareo_generador', cond: { hasModule: 'generador' }, fact: 'cdc_co',
    choices: [
      { id: 'revisar_escape', effects: [{ k: 'stat', stat: 'fatigue', n: 12 }, { k: 'wear', type: 'generador', n: -0.15 }] },
      { id: 'ignorar', effects: [{ k: 'special', id: 'co_risk' }] },
    ],
  }),
  ev({
    id: 'ev_armonica', weight: 0.6,
    choices: [
      { id: 'tocar', effects: [{ k: 'stat', stat: 'morale', n: 6 }, { k: 'mod', kind: 'looters', value: 0.05, hours: 48 }] },
      { id: 'guardar', effects: [{ k: 'stat', stat: 'morale', n: 1 }] },
    ],
  }),
  ev({
    id: 'ev_suenio', weight: 0.7,
    choices: [{ id: 'despertar', effects: [{ k: 'stat', stat: 'morale', n: 5 }] }],
  }),
  ev({
    id: 'ev_ejercicio', minDay: 3,
    choices: [
      { id: 'rutina', effects: [{ k: 'stat', stat: 'morale', n: 5 }, { k: 'stat', stat: 'fatigue', n: 8 }, { k: 'food', kcal: -200 }] },
      { id: 'tumbarse', effects: [{ k: 'stat', stat: 'morale', n: -2 }] },
    ],
  }),
  ev({
    id: 'ev_herramienta_rota', cond: { hasItem: 'herramientas' },
    choices: [
      { id: 'arreglar', requires: { madera: 1 }, effects: [{ k: 'stat', stat: 'fatigue', n: 4 }] },
      { id: 'dejar', effects: [{ k: 'inv', id: 'herramientas', n: -1 }] },
    ],
  }),
];

// ─── Nuclear ─────────────────────────────────────────────────────────────────
export const NUCLEAR_EVENTS: CardData[] = [
  ev({
    id: 'ev_nuc_yodo', threats: ['nuclear'], fact: 'who_ki',
    choices: [
      { id: 'esperar', effects: [{ k: 'stat', stat: 'morale', n: 2 }] },
      { id: 'lugol', effects: [{ k: 'stat', stat: 'health', n: -6 }, { k: 'stat', stat: 'morale', n: 1 }] },
    ],
  }),
  ev({
    id: 'ev_nuc_ropa', threats: ['nuclear'], fact: 'fema_nuclear',
    choices: [
      { id: 'descontaminar', requires: { agua: 4 }, effects: [{ k: 'stat', stat: 'hygiene', n: 10 }] },
      { id: 'ignorar', effects: [{ k: 'dose', mSv: 25 }] },
    ],
  }),
  ev({
    id: 'ev_nuc_lluvia', threats: ['nuclear'], fact: 'kearny_nwss',
    choices: [
      { id: 'recoger', effects: [{ k: 'rawWater', n: 40 }, { k: 'stat', stat: 'fatigue', n: 10 }, { k: 'special', id: 'peek' }] },
      { id: 'no', effects: [] },
    ],
  }),
  ev({
    id: 'ev_nuc_latas', threats: ['nuclear'], fact: 'fema_nuclear',
    choices: [
      { id: 'subir', effects: [{ k: 'special', id: 'peek' }, { k: 'food', kcal: 4000 }] },
      { id: 'no', effects: [{ k: 'stat', stat: 'morale', n: -1 }] },
    ],
  }),
  ev({
    id: 'ev_nuc_nauseas', threats: ['nuclear'], cond: { minDose: 600 }, fact: 'cdc_ars',
    choices: [
      { id: 'sro', requires: { sro: 1 }, effects: [{ k: 'stat', stat: 'health', n: 4 }] },
      { id: 'reposo', effects: [{ k: 'stat', stat: 'fatigue', n: -6 }, { k: 'stat', stat: 'morale', n: -5 }] },
    ],
  }),
  ev({
    id: 'ev_nuc_contador', threats: ['nuclear'], cond: { hasItem: 'dosimetro' }, minDay: 3, fact: 'glasstone',
    choices: [{ id: 'anotar', effects: [{ k: 'stat', stat: 'morale', n: 6 }] }],
  }),
  ev({
    id: 'ev_nuc_escotilla', threats: ['nuclear'], minDay: 1,
    choices: [
      { id: 'abrir', requires: { agua: 10 }, effects: [{ k: 'food', kcal: -3000 }, { k: 'stat', stat: 'morale', n: 12 }, { k: 'dose', mSv: 8 }] },
      { id: 'agua', requires: { agua: 4 }, effects: [{ k: 'stat', stat: 'morale', n: 4 }] },
      { id: 'no', effects: [{ k: 'stat', stat: 'morale', n: -10 }] },
    ],
  }),
  ev({
    id: 'ev_nuc_pem', threats: ['nuclear'], fact: 'glasstone',
    choices: [
      { id: 'revisar', effects: [{ k: 'stat', stat: 'fatigue', n: 4 }] },
      { id: 'ignorar', effects: [{ k: 'chance', p: 0.3, then: [{ k: 'breakModule', type: 'radio' }] }] },
    ],
  }),
  ev({
    id: 'ev_nuc_pelo', threats: ['nuclear'], cond: { minDose: 2500 }, fact: 'cdc_ars',
    choices: [{ id: 'aceptar', effects: [{ k: 'stat', stat: 'morale', n: -8 }] }],
  }),
  ev({
    id: 'ev_nuc_sirenas', threats: ['nuclear'], minDay: 2,
    choices: [
      { id: 'fondo', effects: [{ k: 'stat', stat: 'fatigue', n: 5 }, { k: 'stat', stat: 'morale', n: -3 }] },
      { id: 'asomarse', effects: [{ k: 'special', id: 'peek' }] },
    ],
  }),
];

// ─── Pandemia ────────────────────────────────────────────────────────────────
export const PANDEMIC_EVENTS: CardData[] = [
  ev({
    id: 'ev_pan_paquete', threats: ['pandemia'], fact: 'nejm_surfaces',
    choices: [
      { id: 'lejia', requires: { lejia_ml: 50 }, effects: [{ k: 'food', kcal: 2500 }] },
      { id: 'esperar', effects: [{ k: 'delay', hours: 72, text: 'ev_pan_paquete_tarde', effects: [{ k: 'food', kcal: 2500 }] }] },
      { id: 'abrir', effects: [{ k: 'food', kcal: 2500 }, { k: 'infect', kind: 'pandemia', p: 0.12 }] },
    ],
  }),
  ev({
    id: 'ev_pan_ambulancias', threats: ['pandemia'],
    choices: [
      { id: 'escuchar', effects: [{ k: 'stat', stat: 'morale', n: -6 }] },
      { id: 'tapones', effects: [{ k: 'stat', stat: 'morale', n: -2 }, { k: 'stat', stat: 'fatigue', n: -3 }] },
    ],
  }),
  ev({
    id: 'ev_pan_bulo', threats: ['pandemia'], fact: 'who_myths',
    choices: [
      { id: 'ignorar', effects: [{ k: 'stat', stat: 'morale', n: 2 }] },
      { id: 'probar', effects: [{ k: 'stat', stat: 'health', n: -25 }, { k: 'stat', stat: 'morale', n: -5 }] },
    ],
  }),
  ev({
    id: 'ev_pan_gomas', threats: ['pandemia'], cond: { hasItem: 'ffp2' },
    choices: [
      { id: 'coser', effects: [{ k: 'stat', stat: 'fatigue', n: 5 }] },
      { id: 'tirar', effects: [{ k: 'inv', id: 'ffp2', n: -3 }] },
    ],
  }),
  ev({
    id: 'ev_pan_tos', threats: ['pandemia'], minDay: 2, fact: 'cdc_flu',
    choices: [
      { id: 'aislarse', effects: [{ k: 'stat', stat: 'fatigue', n: -5 }, { k: 'stat', stat: 'morale', n: -3 }] },
      { id: 'restar', effects: [{ k: 'stat', stat: 'morale', n: 2 }] },
    ],
  }),
  ev({
    id: 'ev_pan_reparto', threats: ['pandemia'],
    choices: [
      { id: 'ffp2', requires: { ffp2: 1 }, effects: [{ k: 'food', kcal: 6000 }, { k: 'infect', kind: 'pandemia', p: 0.04 }] },
      { id: 'sin', effects: [{ k: 'food', kcal: 6000 }, { k: 'infect', kind: 'pandemia', p: 0.3 }] },
      { id: 'quedarse', effects: [{ k: 'stat', stat: 'morale', n: -2 }] },
    ],
  }),
  ev({
    id: 'ev_pan_sellado', threats: ['pandemia'], cond: { hasModule: 'ventilacion' }, fact: 'doe_hepa',
    choices: [
      { id: 'revisar', effects: [{ k: 'stat', stat: 'fatigue', n: 6 }, { k: 'mod', kind: 'leakMult', value: 0.7, hours: 96 }] },
      { id: 'confiar', effects: [] },
    ],
  }),
  ev({
    id: 'ev_pan_duelo', threats: ['pandemia'], minDay: 4,
    choices: [
      { id: 'carta', effects: [{ k: 'stat', stat: 'morale', n: -3 }] },
      { id: 'apagar', effects: [{ k: 'stat', stat: 'morale', n: -8 }] },
    ],
  }),
  ev({
    id: 'ev_pan_cortes', threats: ['pandemia'], cond: { gridUp: true },
    choices: [
      { id: 'llenar', effects: [{ k: 'water', n: 20 }, { k: 'stat', stat: 'fatigue', n: 3 }] },
      { id: 'nada', effects: [] },
    ],
  }),
  ev({
    id: 'ev_pan_videollamada', threats: ['pandemia'], cond: { gridUp: true },
    choices: [
      { id: 'llamar', effects: [{ k: 'stat', stat: 'morale', n: 10 }] },
      { id: 'no', effects: [{ k: 'stat', stat: 'morale', n: -3 }] },
    ],
  }),
];

// ─── Colapso civil ───────────────────────────────────────────────────────────
export const COLLAPSE_EVENTS: CardData[] = [
  ev({
    id: 'ev_col_humo', threats: ['colapso'],
    choices: [
      { id: 'tapar', effects: [{ k: 'mod', kind: 'leakMult', value: 0.3, hours: 12 }, { k: 'stat', stat: 'fatigue', n: 4 }] },
      { id: 'vigilar', effects: [{ k: 'stat', stat: 'fatigue', n: 10 }, { k: 'co2', ppm: 1500 }] },
    ],
  }),
  ev({
    id: 'ev_col_gritos', threats: ['colapso'],
    choices: [
      { id: 'apagar', effects: [{ k: 'mod', kind: 'looters', value: -0.1, hours: 48 }, { k: 'stat', stat: 'morale', n: -3 }] },
      { id: 'mirar', effects: [{ k: 'stat', stat: 'morale', n: -6 }, { k: 'chance', p: 0.3, then: [{ k: 'mod', kind: 'looters', value: 0.2, hours: 72 }] }] },
    ],
  }),
  ev({
    id: 'ev_col_mercado', threats: ['colapso'],
    choices: [
      { id: 'comprar', requires: { _kcal: 4000 }, effects: [{ k: 'food', kcal: -4000 }, { k: 'fuel', n: 10 }] },
      { id: 'no', effects: [] },
    ],
  }),
  ev({
    id: 'ev_col_rondas', threats: ['colapso'],
    choices: [
      { id: 'unirse', effects: [{ k: 'stat', stat: 'fatigue', n: 12 }, { k: 'stat', stat: 'morale', n: 6 }, { k: 'mod', kind: 'looters', value: -0.2, hours: 120 }] },
      { id: 'no', effects: [{ k: 'stat', stat: 'morale', n: -2 }] },
    ],
  }),
  ev({
    id: 'ev_col_reparto', threats: ['colapso'],
    choices: [
      { id: 'ir', effects: [{ k: 'water', n: 20 }, { k: 'stat', stat: 'fatigue', n: 12 }, { k: 'chance', p: 0.25, then: [{ k: 'stat', stat: 'injuries', n: 12 }], textThen: 'ev_col_reparto_empujones' }] },
      { id: 'no', effects: [] },
    ],
  }),
  ev({
    id: 'ev_col_marca', threats: ['colapso'],
    choices: [
      { id: 'borrar', effects: [{ k: 'stat', stat: 'fatigue', n: 3 }, { k: 'mod', kind: 'looters', value: -0.1, hours: 72 }] },
      { id: 'dejar', effects: [{ k: 'mod', kind: 'looters', value: 0.2, hours: 72 }] },
    ],
  }),
  ev({
    id: 'ev_col_nino', threats: ['colapso'],
    choices: [
      { id: 'ayudar', requires: { agua: 2 }, effects: [{ k: 'food', kcal: -500 }, { k: 'stat', stat: 'morale', n: 10 }] },
      { id: 'indicar', effects: [{ k: 'stat', stat: 'morale', n: 2 }] },
    ],
  }),
  ev({
    id: 'ev_col_ferreteria', threats: ['colapso'],
    choices: [
      { id: 'ir', effects: [{ k: 'inv', id: 'madera', n: 4 }, { k: 'inv', id: 'sacos', n: 10 }, { k: 'stat', stat: 'fatigue', n: 10 }, { k: 'chance', p: 0.2, then: [{ k: 'stat', stat: 'injuries', n: 10 }] }] },
      { id: 'no', effects: [] },
    ],
  }),
  ev({
    id: 'ev_col_luz', threats: ['colapso'], minDay: 3,
    choices: [{ id: 'mirar', effects: [{ k: 'stat', stat: 'morale', n: 5 }] }],
  }),
];

// ─── Clima ───────────────────────────────────────────────────────────────────
export const CLIMATE_EVENTS: CardData[] = [
  ev({
    id: 'ev_frio_respiradero', threats: ['clima'], variants: ['frio'],
    choices: [
      { id: 'limpiar', effects: [{ k: 'stat', stat: 'fatigue', n: 8 }] },
      { id: 'dejar', effects: [{ k: 'mod', kind: 'leakMult', value: 0.4, hours: 48 }] },
    ],
  }),
  ev({
    id: 'ev_frio_sabanones', threats: ['clima'], variants: ['frio'], fact: 'niosh_cold',
    choices: [
      { id: 'calentar', effects: [{ k: 'stat', stat: 'morale', n: 2 }] },
      { id: 'frotar', effects: [{ k: 'stat', stat: 'injuries', n: 6 }] },
    ],
  }),
  ev({
    id: 'ev_frio_coche', threats: ['clima'], variants: ['frio'], fact: 'niosh_cold',
    choices: [
      { id: 'ayudar', effects: [{ k: 'stat', stat: 'fatigue', n: 20 }, { k: 'stat', stat: 'morale', n: 12 }] },
      { id: 'no', effects: [{ k: 'stat', stat: 'morale', n: -9 }] },
    ],
  }),
  ev({
    id: 'ev_inu_freatico', threats: ['clima'], variants: ['inundacion'],
    choices: [
      { id: 'achicar', effects: [{ k: 'stat', stat: 'fatigue', n: 15 }] },
      { id: 'sacos', requires: { sacos: 12 }, effects: [{ k: 'stat', stat: 'fatigue', n: 6 }] },
      { id: 'nada', effects: [{ k: 'wear', n: 0.15 }] },
    ],
  }),
  ev({
    id: 'ev_inu_mosquitos', threats: ['clima'], variants: ['inundacion'], fact: 'who_cholera',
    choices: [
      { id: 'tapar', requires: { plastico_cinta: 1 }, effects: [] },
      { id: 'aguantar', effects: [{ k: 'stat', stat: 'morale', n: -5 }, { k: 'stat', stat: 'fatigue', n: 5 }] },
    ],
  }),
  ev({
    id: 'ev_inu_grifo', threats: ['clima'], variants: ['inundacion'], fact: 'cdc_water',
    choices: [
      { id: 'hervir', requires: { gas: 1 }, effects: [{ k: 'water', n: 10 }] },
      { id: 'beber', effects: [{ k: 'water', n: 10 }, { k: 'infect', kind: 'gastro', p: 0.5 }] },
      { id: 'tirar', effects: [] },
    ],
  }),
  ev({
    id: 'ev_inu_barca', threats: ['clima'], variants: ['inundacion'],
    choices: [
      { id: 'senales', effects: [{ k: 'food', kcal: 3000 }, { k: 'stat', stat: 'morale', n: 8 }] },
      { id: 'esconderse', effects: [{ k: 'stat', stat: 'morale', n: -4 }] },
    ],
  }),
  ev({
    id: 'ev_sol_auroras', threats: ['clima'], variants: ['tormenta_solar'], fact: 'noaa_swpc',
    choices: [
      { id: 'mirar', effects: [{ k: 'stat', stat: 'morale', n: 7 }] },
      { id: 'no', effects: [] },
    ],
  }),
  ev({
    id: 'ev_sol_brujula', threats: ['clima'], variants: ['tormenta_solar'], fact: 'noaa_swpc',
    choices: [{ id: 'anotar', effects: [{ k: 'stat', stat: 'morale', n: 2 }] }],
  }),
  ev({
    id: 'ev_sol_transformador', threats: ['clima'], variants: ['tormenta_solar'],
    choices: [
      { id: 'refugio', effects: [{ k: 'stat', stat: 'morale', n: -2 }] },
      { id: 'ver', effects: [{ k: 'chance', p: 0.25, then: [{ k: 'stat', stat: 'injuries', n: 12 }], else: [{ k: 'inv', id: 'madera', n: 2 }], textThen: 'ev_sol_transformador_mal', textElse: 'ev_sol_transformador_bien' }] },
    ],
  }),
  ev({
    id: 'ev_sol_coches', threats: ['clima'], variants: ['tormenta_solar'], fact: 'noaa_swpc',
    choices: [{ id: 'entender', effects: [{ k: 'stat', stat: 'morale', n: 3 }] }],
  }),
];

// ─── Crisis finales adicionales ──────────────────────────────────────────────
export const EXTRA_BOSSES: CardData[] = [
  boss({
    id: 'boss_apagon', minPhase: 2,
    base: [{ k: 'breakModule', type: 'baterias' }, { k: 'mod', kind: 'noPower', value: 1, hours: 24 }],
    choices: [
      { id: 'reparar', requires: { madera: 2 }, effects: [{ k: 'stat', stat: 'fatigue', n: 20 }, { k: 'chance', p: 0.6, then: [{ k: 'wear', type: 'baterias', n: -0.6 }], textThen: 'boss_apagon_ok', textElse: 'boss_apagon_mal' }] },
      { id: 'oscuras', effects: [{ k: 'stat', stat: 'morale', n: -8 }] },
    ],
  }),
  boss({
    id: 'boss_soledad', minPhase: 2,
    base: [{ k: 'stat', stat: 'morale', n: -20 }],
    choices: [
      { id: 'escribir', effects: [{ k: 'stat', stat: 'morale', n: 12 }, { k: 'stat', stat: 'fatigue', n: 6 }] },
      { id: 'rutina', effects: [{ k: 'stat', stat: 'morale', n: 6 }, { k: 'stat', stat: 'fatigue', n: -8 }] },
      { id: 'cama', effects: [{ k: 'stat', stat: 'morale', n: -6 }, { k: 'stat', stat: 'fatigue', n: -20 }] },
    ],
  }),
  boss({
    id: 'boss_polvo', threats: ['nuclear'], minPhase: 2, fact: 'glasstone',
    base: [{ k: 'fallout', r1Mult: 0.12 }],
    choices: [
      { id: 'sellar', requires: { plastico_cinta: 1 }, effects: [{ k: 'mod', kind: 'leakMult', value: 0.3, hours: 48 }] },
      { id: 'filtro', requiresModule: 'ventilacion', effects: [{ k: 'stat', stat: 'fatigue', n: 5 }] },
      { id: 'nada', effects: [] },
    ],
  }),
  boss({
    id: 'boss_fiebre', threats: ['pandemia'], minPhase: 2, fact: 'cdc_flu',
    base: [{ k: 'infect', kind: 'pandemia', p: 0.55 }],
    choices: [
      { id: 'reposo', effects: [{ k: 'stat', stat: 'fatigue', n: -25 }] },
      { id: 'medicinas', requires: { analgesicos: 2 }, effects: [{ k: 'stat', stat: 'morale', n: 5 }, { k: 'stat', stat: 'fatigue', n: -10 }] },
    ],
  }),
  boss({
    id: 'boss_incendio', threats: ['colapso'], minPhase: 2,
    base: [{ k: 'co2', ppm: 6000 }],
    choices: [
      { id: 'sellar', requires: { plastico_cinta: 1 }, effects: [{ k: 'mod', kind: 'leakMult', value: 0.2, hours: 24 }] },
      { id: 'ventilar', effects: [{ k: 'stat', stat: 'fatigue', n: 15 }, { k: 'stat', stat: 'health', n: -10 }] },
      { id: 'esperar', effects: [{ k: 'co2', ppm: 4000 }] },
    ],
  }),
  boss({
    id: 'boss_nevada', threats: ['clima'], variants: ['frio'], minPhase: 2,
    base: [{ k: 'mod', kind: 'leakMult', value: 0.3, hours: 72 }, { k: 'mod', kind: 'tempOffset', value: -6, hours: 72 }],
    choices: [
      { id: 'palear', effects: [{ k: 'stat', stat: 'fatigue', n: 30 }, { k: 'mod', kind: 'leakMult', value: 3, hours: 72 }] },
      { id: 'esperar', effects: [{ k: 'stat', stat: 'morale', n: -4 }] },
    ],
  }),
  boss({
    id: 'boss_colera', threats: ['clima'], variants: ['inundacion'], minPhase: 2, fact: 'who_cholera',
    base: [{ k: 'infect', kind: 'gastro', p: 0.7 }],
    choices: [
      { id: 'sro', requires: { sro: 1 }, effects: [{ k: 'inv', id: 'sroActivo', n: 72 }] },
      { id: 'hervir', requires: { gas: 2 }, effects: [{ k: 'stat', stat: 'hygiene', n: 20 }] },
      { id: 'aguantar', effects: [] },
    ],
  }),
  boss({
    id: 'boss_sol_saqueo', threats: ['clima'], variants: ['tormenta_solar'], minPhase: 2,
    choices: [
      { id: 'esconderse', effects: [{ k: 'special', id: 'assault_hide' }] },
      { id: 'negociar', effects: [{ k: 'foodLossPct', pct: 20 }, { k: 'stat', stat: 'morale', n: -5 }] },
      { id: 'resistir', effects: [{ k: 'special', id: 'assault_resist' }] },
    ],
  }),
];

// ─── Amenazas secundarias encadenadas ────────────────────────────────────────
// Lógica causal: tras una guerra o una pandemia llega el colapso del orden; tras el colapso,
// las enfermedades por falta de saneamiento; tras una inundación, epidemias de origen hídrico.
export const SECONDARY_EVENTS: CardData[] = [
  ev({
    id: 'sec_colapso',
    weight: 0,
    choices: [
      { id: 'reforzar', requires: { madera: 2 }, effects: [{ k: 'mod', kind: 'looters', value: -0.15, hours: 96 }] },
      { id: 'aceptar', effects: [{ k: 'stat', stat: 'morale', n: -4 }] },
    ],
  }),
  ev({
    id: 'sec_pandemia',
    weight: 0,
    fact: 'who_cholera',
    choices: [
      { id: 'higiene', requires: { lejia_ml: 100 }, effects: [{ k: 'stat', stat: 'hygiene', n: 15 }] },
      { id: 'aceptar', effects: [{ k: 'stat', stat: 'morale', n: -4 }] },
    ],
  }),
];
