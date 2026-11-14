/** Proyectos de obra: excavar celdas, montar módulos, cubrir con sacos terreros. */
import { COVER, DIG, MODULES } from '../data/modules';
import { canDig, canPlaceModule, digHours, idx } from './bunker';
import { log } from './log';
import type { GameState, ModuleType, Project } from './types';

export type ProjectCheck = { ok: true; hours: number } | { ok: false; reason: string; missing?: Record<string, number> };

function missingItems(s: GameState, req: Record<string, number>): Record<string, number> | null {
  const miss: Record<string, number> = {};
  for (const [id, n] of Object.entries(req)) if ((s.inv[id] ?? 0) < n) miss[id] = n - (s.inv[id] ?? 0);
  return Object.keys(miss).length ? miss : null;
}

export function checkProject(s: GameState, kind: Project['kind'], c: number, r: number, module?: ModuleType): ProjectCheck {
  const b = s.bunker;
  if (b.project) return { ok: false, reason: 'proyecto_en_curso' };
  if (kind === 'excavar') {
    if (!canDig(b, c, r)) return { ok: false, reason: 'no_adyacente' };
    const miss = missingItems(s, DIG.shoring);
    if (miss) return { ok: false, reason: 'faltan_materiales', missing: miss };
    return { ok: true, hours: digHours(s, c, r) };
  }
  if (kind === 'construir') {
    if (!module) return { ok: false, reason: 'sin_modulo' };
    if (!canPlaceModule(b, c, r)) return { ok: false, reason: 'celda_ocupada' };
    const data = MODULES[module];
    if ((data.minPhase ?? 0) > 50) return { ok: false, reason: 'no_disponible' };
    if (b.modules.some((m) => m.type === module) && ['esclusa', 'puerta_blindada', 'letrina'].includes(module))
      return { ok: false, reason: 'ya_existe' };
    const miss = missingItems(s, data.requires);
    if (miss) return { ok: false, reason: 'faltan_materiales', missing: miss };
    return { ok: true, hours: data.hours };
  }
  // cubrir: sacos terreros sobre una sala del nivel −1 (en la casa o como montículo en el jardín)
  if (r !== 1 || b.cells[idx(b, c, 1)] !== 'hueco') return { ok: false, reason: 'no_adyacente' };
  if ((b.coverCm[c] ?? 0) >= COVER.maxCm) return { ok: false, reason: 'cobertura_maxima' };
  if ((s.inv.sacos ?? 0) < COVER.sacosPerLayer) return { ok: false, reason: 'faltan_materiales', missing: { sacos: COVER.sacosPerLayer - (s.inv.sacos ?? 0) } };
  return { ok: true, hours: COVER.hoursPerLayer };
}

/** Inicia un proyecto: consume materiales al empezar. */
export function startProject(s: GameState, kind: Project['kind'], c: number, r: number, module?: ModuleType): boolean {
  const chk = checkProject(s, kind, c, r, module);
  if (!chk.ok) return false;
  const req = kind === 'excavar' ? DIG.shoring : kind === 'construir' ? MODULES[module!].requires : { sacos: COVER.sacosPerLayer };
  for (const [id, n] of Object.entries(req)) s.inv[id] -= n;
  s.bunker.project = { kind, c, r, module, hoursLeft: chk.hours, hoursTotal: chk.hours };
  log(s, 'log.proyecto_inicio', { kind, module: module ?? '' });
  return true;
}

export function cancelProject(s: GameState) {
  const p = s.bunker.project;
  if (!p) return;
  // Los materiales se recuperan solo si no se había empezado a trabajar.
  if (p.hoursLeft === p.hoursTotal) {
    const req = p.kind === 'excavar' ? DIG.shoring : p.kind === 'construir' ? MODULES[p.module!].requires : { sacos: COVER.sacosPerLayer };
    for (const [id, n] of Object.entries(req)) s.inv[id] = (s.inv[id] ?? 0) + n;
  }
  s.bunker.project = null;
}

/** Aplica `workHours` de trabajo efectivo. Devuelve true si se terminó. */
export function progressProject(s: GameState, workHours: number): boolean {
  const p = s.bunker.project;
  if (!p) return false;
  p.hoursLeft = Math.max(0, p.hoursLeft - workHours);
  if (p.hoursLeft > 1e-6) return false;
  const b = s.bunker;
  if (p.kind === 'excavar') {
    b.cells[idx(b, p.c, p.r)] = 'hueco';
    log(s, 'log.excavado', { r: p.r }, 'good');
  } else if (p.kind === 'construir' && p.module) {
    b.modules.push({ uid: b.nextUid++, type: p.module, c: p.c, r: p.r, condition: 1, broken: false });
    if (p.module === 'ventilacion') s.inv.filtroHoras = (s.inv.filtroHoras ?? 0) + 720; // trae un filtro
    log(s, 'log.construido', { module: p.module }, 'good');
  } else if (p.kind === 'cubrir') {
    b.coverCm[p.c] = (b.coverCm[p.c] ?? 0) + COVER.cmPerLayer;
    log(s, 'log.cubierto', { cm: b.coverCm[p.c] }, 'good');
  }
  b.project = null;
  return true;
}

/** Multiplicador de velocidad de excavación con la miniexcavadora alquilada (si está disponible ahora). */
export function excavatorActive(s: GameState, h = s.h) {
  return h >= s.excavatorFromH && h < s.excavatorUntilH;
}
