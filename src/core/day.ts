/** Ciclo diario de la fase de crisis: franjas, fin de día, fases y crisis finales. */
import { BLEACH, GAS, CONSUMPTION } from '../data/items';
import { HYDRO, MAINTENANCE, MODULES, STORAGE } from '../data/modules';
import { CARE, MORALE, WATER } from '../data/physiology';
import { EVENT_CHANCE, phaseLength } from '../data/threats';
import { built, doorStrength, has, hasLivingSpace, storageInfo, working } from './bunker';
import { drawBoss, drawEvent, presentCard } from './cards';
import { applyEffects } from './effects';
import { looterRisk, modValue } from './env';
import { addFood, loseFoodPct, spoil } from './food';
import { clamp, log } from './log';
import { progressProject } from './projects';
import type { Rng } from './rng';
import { efficiency, emptyReport, simulateHour, type HourAct } from './sim';
import type { DayActivity, GameState } from './types';

function runDelayed(s: GameState, rng: Rng) {
  const due = s.delayed.filter((d) => d.atH <= s.h);
  if (!due.length) return;
  s.delayed = s.delayed.filter((d) => d.atH > s.h);
  for (const d of due) {
    if (d.text) log(s, `card.${d.text}`, undefined, 'warn');
    applyEffects(s, rng, d.effects);
  }
}

function hours(s: GameState, rng: Rng, n: number, act: HourAct) {
  for (let i = 0; i < n && s.stage !== 'dead'; i++) {
    simulateHour(s, rng, act, s.lastReport!);
    runDelayed(s, rng);
  }
}

/** Efectos al terminar una franja de 6 h de actividad diurna. */
function finishFranja(s: GameState, act: DayActivity) {
  const sv = s.survivor;
  const eff = efficiency(s);
  const b = s.bunker;
  switch (act) {
    case 'mantener': {
      const broken = b.modules.find((m) => m.broken);
      if (broken && (s.inv.madera ?? 0) >= MAINTENANCE.repairCost.madera) {
        s.inv.madera -= MAINTENANCE.repairCost.madera;
        broken.broken = false;
        broken.condition = 0.5;
        log(s, 'log.reparado', { module: broken.type }, 'good');
      } else if (broken) log(s, 'log.sin_material_reparar', { module: broken.type }, 'warn');
      let budget = MAINTENANCE.conditionPerFranja * eff * (has(b, 'taller') ? MODULES.taller.repairMult! : 1);
      const sorted = b.modules.filter((m) => !m.broken).sort((a, c) => a.condition - c.condition);
      for (const m of sorted) {
        if (budget <= 0) break;
        const add = Math.min(1 - m.condition, budget);
        m.condition += add;
        budget -= add;
      }
      break;
    }
    case 'construir':
      if (b.project) progressProject(s, 6 * eff);
      else log(s, 'log.sin_proyecto', undefined, 'warn');
      break;
    case 'ocio': {
      let m = MORALE.ocioFranja * eff;
      for (const o of working(b, 'ocio')) m += MORALE.ocioModuleBonus * o.condition;
      if ((s.inv.libros_juegos ?? 0) > 0) m += MORALE.booksBonus;
      sv.morale = clamp(sv.morale + m, 0, 100);
      break;
    }
    case 'radio':
      if ((s.inv.radio_dinamo ?? 0) > 0 || has(b, 'radio')) {
        sv.morale = clamp(sv.morale + MORALE.radioFranja + (has(b, 'radio') ? 2 : 0), 0, 100);
        log(s, `log.radio.${s.threat.primary}${(s.day % 3) + 1}`);
      } else log(s, 'log.sin_radio', undefined, 'warn');
      break;
    case 'curar': {
      let did = false;
      if (sv.injuries > 0 && (s.inv.botiquin ?? 0) > 0) {
        s.inv.botiquin = Math.max(0, s.inv.botiquin - 0.34);
        sv.injuries = Math.max(0, sv.injuries - CARE.bandageInjury * (has(b, 'enfermeria') ? 1.5 : 1));
        did = true;
      }
      if (sv.infection?.stage === 'activa') {
        sv.infection.peak *= 1 - CARE.curarPeakReduction;
        if (sv.infection.kind === 'gastro' && (s.inv.sro ?? 0) > 0) {
          s.inv.sro -= 1;
          s.inv.sroActivo = 48;
        }
        if (sv.infection.kind === 'herida' && (s.inv.antibiotico ?? 0) > 0) {
          s.inv.antibiotico -= 1;
          sv.infection.peak *= 1 - CARE.antibioticoHerida;
        }
        did = true;
      }
      if ((s.inv.analgesicos ?? 0) > 0 && (sv.infection?.stage === 'activa' || sv.injuries > 20)) {
        s.inv.analgesicos -= 1;
        sv.fatigue = clamp(sv.fatigue - 10, 0, 100);
        sv.morale = clamp(sv.morale + 2, 0, 100);
        did = true;
      }
      log(s, did ? 'log.curado' : 'log.nada_que_curar', undefined, did ? 'good' : 'info');
      break;
    }
    case 'potabilizar': {
      const mult = has(b, 'purificador') ? MODULES.purificador.potabilizeMult! : 1;
      let liters = Math.min(s.inv.aguaBruta ?? 0, CONSUMPTION.potabilizarLPerH * 6 * eff * mult);
      let method = '';
      if (liters <= 0) {
        log(s, 'log.sin_agua_bruta', undefined, 'warn');
        break;
      }
      if ((s.inv.filtro_agua ?? 0) > 0 || has(b, 'purificador')) method = 'filtro';
      else if ((s.inv.lejia_ml ?? 0) >= BLEACH.mlPerLiter) {
        liters = Math.min(liters, s.inv.lejia_ml / BLEACH.mlPerLiter);
        s.inv.lejia_ml -= liters * BLEACH.mlPerLiter;
        method = 'lejia';
      } else if ((s.inv.hornillo ?? 0) > 0 && (s.inv.gas ?? 0) > 0) {
        liters = Math.min(liters, s.inv.gas * GAS.litersBoiledPerCartridge);
        s.inv.gas -= liters / GAS.litersBoiledPerCartridge;
        method = 'hervir';
      } else {
        log(s, 'log.sin_metodo_potabilizar', undefined, 'warn');
        break;
      }
      s.inv.aguaBruta -= liters;
      s.inv.agua = (s.inv.agua ?? 0) + liters;
      log(s, 'log.potabilizado', { l: Math.round(liters), method }, 'good');
      break;
    }
    case 'vigilar':
      s.threat.mods.push({ fromH: s.h, toH: s.h + 24, kind: 'looters', value: has(b, 'periscopio') ? -0.14 : -0.08 });
      break;
    case 'descansar':
      sv.morale = clamp(sv.morale + 1, 0, 100);
      if (sv.infection?.stage === 'activa') sv.infection.peak *= 1 - CARE.restPeakReductionPerFranja;
      break;
    case 'ventilar':
      break;
  }
  if (s.inv.sroActivo) s.inv.sroActivo = Math.max(0, s.inv.sroActivo - 6);
}

/** Simula las 24 h del plan actual (07:00 → 07:00). */
export function runDay(s: GameState, rng: Rng, bossDay = false) {
  s.lastReport = emptyReport(s);
  const p = s.plan;
  for (const act of [p.morning, p.afternoon]) {
    hours(s, rng, 6, act);
    if (s.stage === 'dead') return;
    finishFranja(s, act);
  }
  if (p.night === 'dormir') {
    hours(s, rng, 4, 'velada');
    hours(s, rng, 8, 'dormir');
  } else hours(s, rng, 12, 'guardia');
  if (s.stage === 'dead') return;
  endOfDay(s, rng, bossDay);
}

function endOfDay(s: GameState, rng: Rng, bossDay: boolean) {
  const sv = s.survivor;
  const r = s.lastReport!;
  const b = s.bunker;
  s.day++;
  s.stats.daysSurvived = s.day;

  // Moral diaria
  let dm = MORALE.dailyIsolation;
  if (r.hoursDark > 10) dm += MORALE.darkness;
  else if (r.hoursDark > 4) dm += MORALE.darkness / 2;
  if (r.hoursHighCo2 > 8) dm += MORALE.highCo2;
  if (s.plan.food === 'minima') dm += MORALE.hunger;
  else if (s.plan.food === 'reducida') dm += MORALE.hunger / 3;
  if (sv.waterDeficitL > WATER.deficitThirstL) dm += MORALE.thirst;
  if (sv.hygiene < 30) dm += MORALE.dirty;
  if (has(b, 'dormitorio')) dm += 1;
  for (const m of working(b, 'radio')) dm += MODULES.radio.moraleBonus! * m.condition;
  if (sv.infection?.stage === 'activa' || sv.injuries > 30) dm -= 2;
  const st = storageInfo(s);
  if (st.used > st.cap) {
    dm += STORAGE.overMoralePerDay;
    log(s, 'log.almacen_lleno', undefined, 'warn');
  }
  if (!hasLivingSpace(b)) dm -= 2;
  if (working(b, 'hidroponico').length) dm += 1;
  sv.morale = clamp(sv.morale + dm, 0, 100);
  if (sv.morale < MORALE.breakdownBelow) log(s, 'log.crisis_nerviosa', undefined, 'bad');

  // Desgaste y averías
  for (const m of b.modules) {
    if (m.type !== 'generador') m.condition = Math.max(0, m.condition - MODULES[m.type].wearPerDay);
    if (!m.broken && m.condition < MAINTENANCE.breakBelow && rng.chance(MAINTENANCE.breakChancePerDay)) {
      m.broken = true;
      log(s, 'log.averia', { module: m.type }, 'bad');
    }
  }

  // Cultivo hidropónico: crece si tuvo luz y agua
  for (const m of working(b, 'hidroponico')) {
    const lit = 24 - r.hoursUnpowered >= HYDRO.minPoweredHours;
    if (lit && (s.inv.agua ?? 0) >= HYDRO.waterLPerDay) {
      s.inv.agua -= HYDRO.waterLPerDay;
      m.growth = (m.growth ?? 0) + 1;
      if (m.growth >= HYDRO.growDays) {
        const kcal = (MODULES.hidroponico.kcalPerDay ?? 0) * m.condition;
        addFood(s, 'fresco', kcal, s.h + 24 * 5);
        if (m.growth === HYDRO.growDays) log(s, 'log.cosecha', undefined, 'good');
      }
    } else if ((m.growth ?? 0) > 0) {
      m.growth = Math.max(0, (m.growth ?? 0) - 2);
      log(s, 'log.cultivo_sufre', undefined, 'warn');
    }
  }

  // Caducidad
  const lost = spoil(s);
  if (lost > 0) log(s, 'log.caducado', { kcal: Math.round(lost) }, 'warn');

  // Saqueadores nocturnos
  const risk = looterRisk(s);
  if (risk > 0 && rng.chance(Math.min(0.6, risk * 0.3))) {
    const guard = (s.plan.night === 'guardia' ? 0.25 : 0) + (has(b, 'periscopio') ? 0.1 : 0);
    const vig = modValue(s, 'looters') < 0 ? 0.15 : 0;
    if (rng.chance(clamp(doorStrength(b) + guard + vig, 0.05, 0.95))) log(s, 'log.saqueo_rechazado', undefined, 'warn');
    else {
      const k = loseFoodPct(s, rng.int(8, 20));
      const w = Math.round((s.inv.agua ?? 0) * 0.12);
      s.inv.agua -= w;
      sv.morale = clamp(sv.morale - 6, 0, 100);
      if (rng.chance(0.3)) sv.injuries = clamp(sv.injuries + rng.int(8, 20), 0, 100);
      log(s, 'log.saqueo', { kcal: Math.round(k), agua: w }, 'bad');
    }
  }
  s.noise24 = 0;
  s.visibility *= 0.7;
  if (s.plan.lights && !built(b, 'esclusa')) s.visibility += 0.5;

  // Limpieza de modificadores caducados
  s.threat.mods = s.threat.mods.filter((m) => m.toH > s.h);

  if (bossDay) return;
  // Fase: ¿crisis final o siguiente día?
  if (s.phaseDay >= s.phaseLength) {
    presentCard(s, rng, drawBoss(s, rng));
    log(s, 'log.crisis_final', undefined, 'bad');
    return;
  }
  s.phaseDay++;
  if (rng.chance(EVENT_CHANCE)) {
    const id = drawEvent(s, rng);
    if (id) {
      presentCard(s, rng, id);
      return;
    }
  }
  s.stage = 'crisis';
}

/** Tras elegir en la crisis final: se vive el día de crisis y, si sobrevives, termina la fase. */
export function runBossDay(s: GameState, rng: Rng) {
  s.stage = 'crisis';
  // El día de la crisis final cuenta como un día extra al final de la fase.
  runDay(s, rng, true);
  if ((s.stage as string) === 'dead') return;
  s.pending = null;
  s.stage = 'phaseEnd';
  s.stats.bossesBeaten++;
  log(s, 'log.fase_superada', { phase: s.phase }, 'good');
}

export function nextPhase(s: GameState) {
  s.phase++;
  s.phaseDay = 1;
  s.phaseLength = phaseLength(s.phase);
  s.stage = 'crisis';
  log(s, 'log.fase_inicio', { phase: s.phase, days: s.phaseLength });
}
