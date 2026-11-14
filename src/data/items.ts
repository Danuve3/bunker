/**
 * Tiendas y artículos de la fase 0.
 * Precios: valores medios orientativos en España, 2025 (ine_precios). Simplificación:
 * se redondean y no se modelan ofertas ni diferencias entre cadenas.
 * Los nombres y descripciones están en i18n (es-content).
 */

export type ShopId = 'super' | 'ferreteria' | 'farmacia' | 'gasolinera' | 'outdoor' | 'online' | 'alquiler';

export interface ShopData {
  /** Horas de ida y vuelta + cola (simplificación). */
  tripH: number;
  /** Las compras online llegan tras este retraso (h). */
  deliveryH?: number;
}

export const SHOPS: Record<ShopId, ShopData> = {
  super: { tripH: 1.25 },
  ferreteria: { tripH: 1.5 },
  farmacia: { tripH: 0.5 },
  gasolinera: { tripH: 0.5 },
  outdoor: { tripH: 1.5 },
  online: { tripH: 0.25, deliveryH: 24 },
  alquiler: { tripH: 0.25 },
};

export type ItemKind = 'water' | 'fuel' | 'food' | 'goods' | 'service';

export interface ItemData {
  shop: ShopId;
  price: number; // €
  kind: ItemKind;
  /** Para goods: id de inventario y cantidad que añade cada unidad comprada. */
  adds?: { id: string; n: number };
  /** Agua (L) o combustible (L) por unidad. */
  liters?: number;
  /** Alimentos: kcal por unidad, vida útil (días) y si necesita cocinarse. */
  kcal?: number;
  shelfDays?: number;
  cook?: boolean;
  /** Existencias iniciales en la tienda. */
  stock: number;
  /** Demanda en pánico (0..1): cuánto se agota al acercarse el evento. */
  demand: number;
  /** Amenazas en las que la demanda se dispara (×1,6). */
  hot?: string[];
}

export const ITEMS: Record<string, ItemData> = {
  // ── Supermercado ──
  garrafa_agua: { shop: 'super', price: 1.4, kind: 'water', liters: 8, stock: 60, demand: 0.9 },
  arroz: { shop: 'super', price: 1.3, kind: 'food', kcal: 3600, shelfDays: 720, cook: true, stock: 40, demand: 0.85 },
  pasta: { shop: 'super', price: 1.1, kind: 'food', kcal: 3600, shelfDays: 540, cook: true, stock: 40, demand: 0.8 },
  legumbres: { shop: 'super', price: 0.95, kind: 'food', kcal: 300, shelfDays: 1000, stock: 80, demand: 0.7 },
  atun: { shop: 'super', price: 3.5, kind: 'food', kcal: 600, shelfDays: 1400, stock: 50, demand: 0.7 },
  conserva_plato: { shop: 'super', price: 2.2, kind: 'food', kcal: 450, shelfDays: 1000, stock: 60, demand: 0.75 },
  aceite: { shop: 'super', price: 9, kind: 'food', kcal: 8200, shelfDays: 540, stock: 20, demand: 0.5 },
  frutos_secos: { shop: 'super', price: 5.5, kind: 'food', kcal: 3000, shelfDays: 240, stock: 25, demand: 0.5 },
  galletas: { shop: 'super', price: 2.5, kind: 'food', kcal: 3600, shelfDays: 300, stock: 40, demand: 0.6 },
  fresco: { shop: 'super', price: 6, kind: 'food', kcal: 1500, shelfDays: 6, stock: 30, demand: 0.4 },
  lejia: { shop: 'super', price: 1.2, kind: 'goods', adds: { id: 'lejia_ml', n: 1000 }, stock: 20, demand: 0.6 },
  pilas: { shop: 'super', price: 5, kind: 'goods', adds: { id: 'pilas', n: 1 }, stock: 30, demand: 0.6 },
  higiene: { shop: 'super', price: 12, kind: 'goods', adds: { id: 'higiene', n: 1 }, stock: 20, demand: 0.5, hot: ['pandemia'] },
  // ── Ferretería / bricolaje ──
  herramientas: { shop: 'ferreteria', price: 70, kind: 'goods', adds: { id: 'herramientas', n: 1 }, stock: 6, demand: 0.3 },
  sacos: { shop: 'ferreteria', price: 15, kind: 'goods', adds: { id: 'sacos', n: 25 }, stock: 20, demand: 0.5, hot: ['nuclear', 'clima'] },
  madera: { shop: 'ferreteria', price: 35, kind: 'goods', adds: { id: 'madera', n: 10 }, stock: 15, demand: 0.3 },
  cemento: { shop: 'ferreteria', price: 5, kind: 'goods', adds: { id: 'cemento', n: 1 }, stock: 60, demand: 0.3 },
  plastico_cinta: { shop: 'ferreteria', price: 20, kind: 'goods', adds: { id: 'plastico_cinta', n: 1 }, stock: 15, demand: 0.6, hot: ['pandemia', 'nuclear'] },
  deposito_500: { shop: 'ferreteria', price: 140, kind: 'goods', adds: { id: 'deposito_500', n: 1 }, stock: 4, demand: 0.4 },
  bidon_25: { shop: 'ferreteria', price: 14, kind: 'goods', adds: { id: 'bidon_25', n: 1 }, stock: 20, demand: 0.6 },
  generador_diesel: { shop: 'ferreteria', price: 950, kind: 'goods', adds: { id: 'generador_diesel', n: 1 }, stock: 3, demand: 0.7, hot: ['colapso', 'clima'] },
  bateria_agm: { shop: 'ferreteria', price: 210, kind: 'goods', adds: { id: 'bateria_agm', n: 1 }, stock: 8, demand: 0.4 },
  inversor: { shop: 'ferreteria', price: 160, kind: 'goods', adds: { id: 'inversor', n: 1 }, stock: 5, demand: 0.4 },
  ventilador_filtro: { shop: 'ferreteria', price: 90, kind: 'goods', adds: { id: 'ventilador_filtro', n: 1 }, stock: 5, demand: 0.5, hot: ['nuclear', 'pandemia'] },
  filtro_hepa: { shop: 'ferreteria', price: 45, kind: 'goods', adds: { id: 'filtro_hepa', n: 1 }, stock: 10, demand: 0.6, hot: ['nuclear', 'pandemia'] },
  puerta_acero: { shop: 'ferreteria', price: 600, kind: 'goods', adds: { id: 'puerta_acero', n: 1 }, stock: 2, demand: 0.3 },
  inodoro_quimico: { shop: 'ferreteria', price: 80, kind: 'goods', adds: { id: 'inodoro_quimico', n: 1 }, stock: 5, demand: 0.4 },
  tubo_periscopio: { shop: 'ferreteria', price: 30, kind: 'goods', adds: { id: 'tubo_periscopio', n: 1 }, stock: 4, demand: 0.1 },
  medidor_co2: { shop: 'ferreteria', price: 60, kind: 'goods', adds: { id: 'medidor_co2', n: 1 }, stock: 5, demand: 0.2 },
  // ── Farmacia ──
  botiquin: { shop: 'farmacia', price: 35, kind: 'goods', adds: { id: 'botiquin', n: 1 }, stock: 10, demand: 0.6 },
  analgesicos: { shop: 'farmacia', price: 4, kind: 'goods', adds: { id: 'analgesicos', n: 1 }, stock: 25, demand: 0.7 },
  sro: { shop: 'farmacia', price: 6, kind: 'goods', adds: { id: 'sro', n: 1 }, stock: 20, demand: 0.5 },
  ffp2: { shop: 'farmacia', price: 7, kind: 'goods', adds: { id: 'ffp2', n: 10 }, stock: 20, demand: 0.6, hot: ['pandemia'] },
  // ── Gasolinera ──
  diesel: { shop: 'gasolinera', price: 45, kind: 'fuel', liters: 20, stock: 20, demand: 0.9 },
  // ── Montaña / camping ──
  hornillo: { shop: 'outdoor', price: 20, kind: 'goods', adds: { id: 'hornillo', n: 1 }, stock: 8, demand: 0.5 },
  cartuchos_gas: { shop: 'outdoor', price: 10, kind: 'goods', adds: { id: 'gas', n: 4 }, stock: 20, demand: 0.6 },
  saco_dormir: { shop: 'outdoor', price: 70, kind: 'goods', adds: { id: 'saco_dormir', n: 1 }, stock: 6, demand: 0.5, hot: ['clima'] },
  ropa_termica: { shop: 'outdoor', price: 45, kind: 'goods', adds: { id: 'ropa_termica', n: 1 }, stock: 8, demand: 0.4, hot: ['clima'] },
  mantas: { shop: 'outdoor', price: 25, kind: 'goods', adds: { id: 'mantas', n: 1 }, stock: 10, demand: 0.4 },
  linterna: { shop: 'outdoor', price: 20, kind: 'goods', adds: { id: 'linterna', n: 1 }, stock: 10, demand: 0.5 },
  radio_dinamo: { shop: 'outdoor', price: 35, kind: 'goods', adds: { id: 'radio_dinamo', n: 1 }, stock: 6, demand: 0.5 },
  filtro_agua: { shop: 'outdoor', price: 60, kind: 'goods', adds: { id: 'filtro_agua', n: 1 }, stock: 5, demand: 0.5 },
  libros_juegos: { shop: 'outdoor', price: 20, kind: 'goods', adds: { id: 'libros_juegos', n: 1 }, stock: 10, demand: 0.1 },
  // ── Tienda online (llega en 24 h si el evento no lo impide) ──
  dosimetro: { shop: 'online', price: 160, kind: 'goods', adds: { id: 'dosimetro', n: 1 }, stock: 5, demand: 0.3, hot: ['nuclear'] },
  liofilizada: { shop: 'online', price: 12, kind: 'food', kcal: 2000, shelfDays: 3600, stock: 40, demand: 0.6 },
  bateria_online: { shop: 'online', price: 180, kind: 'goods', adds: { id: 'bateria_agm', n: 1 }, stock: 6, demand: 0.3 },
  kit_hidroponico: { shop: 'online', price: 140, kind: 'goods', adds: { id: 'kit_hidroponico', n: 1 }, stock: 4, demand: 0.2 },
  emisora: { shop: 'online', price: 260, kind: 'goods', adds: { id: 'emisora', n: 1 }, stock: 3, demand: 0.3 },
  filtro_online: { shop: 'online', price: 35, kind: 'goods', adds: { id: 'filtro_hepa', n: 1 }, stock: 8, demand: 0.4 },
  // ── Alquiler ──
  miniexcavadora: { shop: 'alquiler', price: 280, kind: 'service', stock: 2, demand: 0.6 },
};

/** Miniexcavadora: entrega en 6 h, disponible 24 h, excava ~8× más rápido que a mano. */
export const EXCAVATOR = { deliveryH: 6, durationH: 24, speedMult: 8, rockMult: 3 } as const;

/** Tiempo de manipulación por unidad comprada (cargar, pagar), h. Simplificación. */
export const HANDLING_H_PER_UNIT = 0.02;

/** Pánico: fracción máxima de existencias que se agota justo antes del evento; subida de precio. */
export const PANIC = { maxDrain: 0.85, hotMult: 1.6, priceSurge: 0.5 } as const;

/** Gas butano: 1 cartucho (230 g, ~2,6 kWh) hierve ~13 L de agua o cocina ~6.000 kcal de arroz/pasta.
 *  Calentar 1 L de 15 a 100 °C ≈ 0,1 kWh; con un rendimiento del 50 % ⇒ 0,2 kWh/L (simplificación). */
export const GAS = { litersBoiledPerCartridge: 13, kcalCookedPerCartridge: 6000, waterPerCookedKcal: 0.6 / 1000 } as const;

/** Lejía: 2 gotas (~0,1 mL) de lejía al 5-6 % por litro de agua clara, esperar 30 min (cdc_water, sanidad_lejia). */
export const BLEACH = { mlPerLiter: 0.1, waitH: 0.5 } as const;

/** Consumo de consumibles (simplificaciones). */
export const CONSUMPTION = {
  higieneKitDays: 10,
  hepaFilterDays: 30,
  ffp2PerExposure: 1,
  /** Llenar un bidón de 25 L con agua del grifo. */
  bidonFillH: 0.15,
  /** Llenar la bañera (~150 L de agua no potable para aseo), consejo FEMA. */
  bathtubL: 150,
  bathtubH: 0.5,
  /** Llenar un depósito de 500 L con manguera (~15 L/min). */
  tankFillH: 0.6,
  potabilizarLPerH: 8,
} as const;
