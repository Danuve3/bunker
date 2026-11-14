/** Consultas puras sobre la cuadrícula del búnker: blindaje, volumen, módulos. */
import { CELL_VOLUME_M3, ENTRY_PF_CAP, GRID, HALF_VALUE_CM } from '../data/environment';
import { BASE_DOOR_STRENGTH, DIG, MODULES } from '../data/modules';
import type { Bunker, CellKind, GameState, ModuleInst, ModuleType } from './types';

export const idx = (b: Bunker, c: number, r: number) => r * b.cols + c;
export const cellAt = (b: Bunker, c: number, r: number): CellKind | null =>
  c < 0 || r < 0 || c >= b.cols || r >= b.rows ? null : b.cells[idx(b, c, r)];

export function dugCells(b: Bunker): { c: number; r: number }[] {
  const out: { c: number; r: number }[] = [];
  for (let r = 1; r < b.rows; r++) for (let c = 0; c < b.cols; c++) if (b.cells[idx(b, c, r)] === 'hueco') out.push({ c, r });
  return out;
}

export const airVolume = (b: Bunker) => dugCells(b).length * CELL_VOLUME_M3;

export const moduleAt = (b: Bunker, c: number, r: number) => b.modules.find((m) => m.c === c && m.r === r) ?? null;

export function working(b: Bunker, type: ModuleType): ModuleInst[] {
  return b.modules.filter((m) => m.type === type && !m.broken);
}
export const has = (b: Bunker, type: ModuleType) => working(b, type).length > 0;
export const built = (b: Bunker, type: ModuleType) => b.modules.some((m) => m.type === type);

/** Capa de 2^(espesor/semirreducción). */
const halvings = (cm: number, mat: keyof typeof HALF_VALUE_CM) => cm / HALF_VALUE_CM[mat];

/** Factor de protección sin límite de entrada, solo por lo que hay encima de la celda. */
export function overheadPF(b: Bunker, c: number, r: number): number {
  let n = halvings(GRID.houseFloorCm, 'hormigon') + halvings(b.coverCm[c] ?? 0, 'tierra');
  for (let rr = 1; rr < r; rr++) {
    const k = b.cells[idx(b, c, rr)];
    const cm = GRID.cellHeightM * 100;
    if (k === 'hueco') n += halvings(GRID.slabCm, 'hormigon');
    else if (k === 'roca') n += halvings(cm, 'hormigon'); // roca ≈ hormigón (densidad similar)
    else n += halvings(cm, 'tierra');
  }
  return Math.pow(2, n) * GRID.houseExtraPF;
}

export function entryCap(b: Bunker): number {
  const esclusa = has(b, 'esclusa');
  const puerta = has(b, 'puerta_blindada');
  if (esclusa && puerta) return ENTRY_PF_CAP.esclusaYPuerta;
  if (esclusa) return ENTRY_PF_CAP.esclusa;
  return ENTRY_PF_CAP.base;
}

export function cellPF(b: Bunker, c: number, r: number): number {
  return Math.min(entryCap(b), overheadPF(b, c, r));
}

/** Celda donde el superviviente pasa la mayor parte del tiempo: la de mayor PF (y más honda). */
export function shelterCell(b: Bunker): { c: number; r: number; pf: number } {
  let best = { c: b.entryCol, r: 1, pf: 0 };
  for (const cell of dugCells(b)) {
    const pf = cellPF(b, cell.c, cell.r);
    if (pf > best.pf || (pf === best.pf && cell.r > best.r)) best = { ...cell, pf };
  }
  return best;
}

export const shelterPF = (b: Bunker) => shelterCell(b).pf;

export function batteryCapacityWh(b: Bunker): number {
  return working(b, 'baterias').reduce((s, m) => s + (MODULES.baterias.batteryWh ?? 0) * Math.max(0.3, m.condition), 0);
}

export function doorStrength(b: Bunker): number {
  return has(b, 'puerta_blindada') ? MODULES.puerta_blindada.doorStrength! : BASE_DOOR_STRENGTH;
}

export function canDig(b: Bunker, c: number, r: number): boolean {
  const k = cellAt(b, c, r);
  if (r < 1 || !k || k === 'hueco') return false;
  return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dc, dr]) => cellAt(b, c + dc, r + dr) === 'hueco');
}

/** Horas de excavación manual de una celda (sin excavadora). */
export function digHours(s: GameState, c: number, r: number): number {
  const b = s.bunker;
  const k = cellAt(b, c, r) ?? 'tierra';
  let rate = DIG.m3PerHour[k] / (1 + DIG.depthPenaltyPerRow * (r - 1));
  if (!(s.inv.herramientas > 0)) rate *= DIG.noToolsMult;
  return Math.ceil(CELL_VOLUME_M3 / rate);
}

export function canPlaceModule(b: Bunker, c: number, r: number): boolean {
  return cellAt(b, c, r) === 'hueco' && !moduleAt(b, c, r) && !(b.project && b.project.c === c && b.project.r === r);
}
