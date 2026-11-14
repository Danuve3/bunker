/**
 * Simulación horaria de la fase de crisis. Función pura sobre el estado (lo muta in situ:
 * el reductor siempre trabaja sobre un clon). Sin DOM, sin Math.random().
 */
import { AIR, DOSE, FALLOUT, POWER, THERMAL } from '../data/environment';
import { CONSUMPTION } from '../data/items';
import { GEN_NOISE_BY_ROW, MODULES } from '../data/modules';
import {
  ACTIVITY_INTENSITY,
  ENERGY,
  FATIGUE,
  HEALTH,
  INFECTIONS,
  MORALE,
  THERMO,
  WATER,
} from '../data/physiology';
import { airVolume, batteryCapacityWh, dugCells, has, shelterCell, working } from './bunker';
import { clockHour, groundTemp, gridUp, mainsUp, modActive, modValue, outdoorDoseRate, outdoorTemp } from './env';
import { eat } from './food';
import { clamp, log } from './log';
import type { Rng } from './rng';
import type { DayActivity, DayReport, DeathCause, GameState, InfectionKind } from './types';

export type HourAct = DayActivity | 'dormir' | 'velada' | 'guardia' | 'refugio';
type Intensity = keyof typeof ENERGY.kcalPerHour;

export function emptyReport(s: GameState): DayReport {
  return {
    fromH: s.h,
    toH: s.h,
    waterUsedL: 0,
    kcalEaten: 0,
    kcalSpent: 0,
    doseMSv: 0,
    fuelUsedL: 0,
    energyUsedWh: 0,
    co2Max: s.bunker.co2ppm,
    tempMin: s.bunker.interiorTempC,
    hoursDark: 0,
    hoursHighCo2: 0,
    hoursCold: 0,
    hoursUnpowered: 0,
    notes: [],
  };
}

function intensityOf(act: HourAct, s: GameState): Intensity {
  if (act === 'dormir') return 'dormir';
  if (act === 'velada' || act === 'guardia') return act === 'guardia' ? 'ligero' : 'reposo';
  if (act === 'refugio') {
    const c = clockHour(s);
    return c >= 23 || c < 7 ? 'dormir' : 'reposo';
  }
  return ACTIVITY_INTENSITY[act];
}

const MEAL_HOURS = [8, 14, 20];

export function infect(s: GameState, rng: Rng, kind: InfectionKind): boolean {
  const sv = s.survivor;
  if (sv.infection || sv.immuneTo.includes(kind)) return false;
  const d = INFECTIONS[kind];
  sv.infection = {
    kind,
    stage: 'incubando',
    hoursLeft: rng.int(d.incubationH[0], d.incubationH[1]),
    activeTotal: rng.int(d.activeH[0], d.activeH[1]),
    peak: rng.range(d.peak[0], d.peak[1]),
    severity: 0,
  };
  return true;
}

export function kill(s: GameState, cause: DeathCause) {
  if (s.stage === 'dead') return;
  s.survivor.health = 0;
  s.stage = 'dead';
  s.deathCause = cause;
  s.pending = null;
  log(s, 'log.muerte', { cause }, 'bad');
}

interface PowerResult {
  fan: boolean;
  light: boolean;
  genW: number;
}

function powerStep(s: GameState, act: HourAct, r: DayReport): PowerResult {
  const b = s.bunker;
  const awake = intensityOf(act, s) !== 'dormir';
  const wantLight = s.plan.lights && awake;
  const vents = working(b, 'ventilacion');
  const wantFan = s.plan.fan && vents.length > 0 && !modActive(s, 'fanOff');
  const fanW = wantFan ? vents.reduce((t, m) => t + (MODULES[m.type].powerW ?? 0), 0) : 0;
  const otherW = b.modules
    .filter((m) => !m.broken && m.type !== 'ventilacion' && MODULES[m.type].powerW)
    .reduce((t, m) => t + (MODULES[m.type].powerW ?? 0), 0);
  const lightW = wantLight ? POWER.lightsW : 0;
  const loadW = lightW + fanW + otherW;
  const cap = batteryCapacityWh(b);
  s.batteryWh = Math.min(s.batteryWh, cap);

  let powered = false;
  let genW = 0;
  if (modActive(s, 'noPower')) {
    powered = false;
    b.genRunning = false;
  } else if (gridUp(s)) {
    powered = true;
    s.batteryWh = Math.min(cap, s.batteryWh + 300 * POWER.chargeEfficiency);
    b.genRunning = false;
  } else {
    const genOk = working(b, 'generador').length > 0 && (s.inv.diesel ?? 0) > 0;
    let run = false;
    if (genOk) {
      if (s.plan.generator === 'on') run = true;
      else if (s.plan.generator === 'auto') {
        if (cap > 0) {
          const frac = s.batteryWh / cap;
          run = frac < POWER.autoStartFrac || (b.genRunning && frac < POWER.autoStopFrac);
        } else run = loadW > 0;
      }
    }
    b.genRunning = run;
    if (run) {
      const nBat = working(b, 'baterias').length;
      const chargeW = cap > 0 ? Math.min((cap - s.batteryWh) / POWER.chargeEfficiency, 400 * nBat) : 0;
      genW = Math.min(POWER.generatorW, loadW + chargeW);
      const fuel = Math.min(s.inv.diesel, POWER.dieselIdleLPerH + (genW / 1000) * POWER.dieselLPerKWh);
      s.inv.diesel -= fuel;
      r.fuelUsedL += fuel;
      s.batteryWh = Math.min(cap, s.batteryWh + chargeW * POWER.chargeEfficiency);
      const genRow = Math.min(...working(b, 'generador').map((m) => m.r));
      s.noise24 += POWER.generatorNoisePerH * GEN_NOISE_BY_ROW[Math.min(genRow, GEN_NOISE_BY_ROW.length - 1)];
      for (const m of working(b, 'generador')) m.condition -= MODULES.generador.wearPerDay / 24;
      powered = true;
    } else if (s.batteryWh >= loadW) {
      s.batteryWh -= loadW;
      powered = true;
    }
  }
  if (powered) r.energyUsedWh += loadW;
  else if (loadW > 0) r.hoursUnpowered++;

  let light = wantLight && powered;
  if (wantLight && !light && (s.inv.linterna ?? 0) > 0 && (s.inv.pilas ?? 0) > 0) {
    s.inv.pilas = Math.max(0, s.inv.pilas - 1 / POWER.batteryPackLightH);
    light = true;
  }
  if (awake && !light) r.hoursDark++;
  return { fan: wantFan && powered, light, genW };
}

export function simulateHour(s: GameState, rng: Rng, act0: HourAct, r: DayReport) {
  if (s.stage === 'dead') return;
  const b = s.bunker;
  const sv = s.survivor;
  let act = act0;
  if (sv.fatigue >= FATIGUE.collapseAt && act !== 'dormir') act = 'dormir';
  const int = intensityOf(act, s);
  const sleeping = int === 'dormir';

  // ── Energía ──
  const pw = powerStep(s, act, r);

  // ── Aire (CO₂, solución exacta de un tanque bien mezclado) ──
  const V = Math.max(1, airVolume(b));
  let leakMult = 1;
  for (const m of s.threat.mods) if (m.kind === 'leakMult' && s.h >= m.fromH && s.h < m.toH) leakMult *= m.value;
  const leakQ = AIR.leakAch * V * leakMult;
  const fanQ = pw.fan ? working(b, 'ventilacion').reduce((t, m) => t + (MODULES[m.type].airflowM3h ?? 0), 0) : 0;
  let filtered = false;
  if (fanQ > 0) {
    if ((s.inv.filtroHoras ?? 0) <= 0 && (s.inv.filtro_hepa ?? 0) > 0) {
      s.inv.filtro_hepa -= 1;
      s.inv.filtroHoras = CONSUMPTION.hepaFilterDays * 24;
      log(s, 'log.filtro_cambiado');
    }
    if ((s.inv.filtroHoras ?? 0) > 0) {
      filtered = true;
      s.inv.filtroHoras -= 1;
    }
  }
  const manualQ = act === 'ventilar' ? AIR.manualM3h : 0;
  const Q = leakQ + fanQ + manualQ;
  const unfilteredQ = leakQ + manualQ + (filtered ? 0 : fanQ);
  const genM3h = AIR.co2KgPerDay / 24 / AIR.co2DensityKgM3;
  const ceq = AIR.outdoorPpm + (genM3h / Q) * 1e6;
  b.co2ppm = ceq + (b.co2ppm - ceq) * Math.exp(-Q / V);
  r.co2Max = Math.max(r.co2Max, b.co2ppm);
  if (b.co2ppm > AIR.pelPpm) r.hoursHighCo2++;

  // ── Radiación ──
  const outRate = outdoorDoseRate(s);
  const shelter = shelterCell(b);
  const rate = outRate / Math.max(1, shelter.pf) + outRate * unfilteredQ * FALLOUT.unfilteredIngressPerM3h * 0.5;
  sv.doseMSv += rate;
  sv.acuteDoseMSv = sv.acuteDoseMSv * Math.pow(0.5, 1 / DOSE.repairHalfLifeH) + rate;
  r.doseMSv += rate;
  s.stats.maxDoseMSv = Math.max(s.stats.maxDoseMSv, sv.doseMSv);

  // ── Temperatura interior ──
  const tOut = outdoorTemp(s);
  const tg = groundTemp(s);
  const coupling = THERMAL.surfaceCoupling[Math.min(shelter.r, THERMAL.surfaceCoupling.length - 1)];
  const nDug = Math.max(1, dugCells(b).length);
  const heatW = THERMAL.bodyHeatW + pw.genW * 2 * THERMAL.generatorHeatFrac;
  let target = tg + (tOut - tg) * coupling + heatW / (THERMAL.uaPerCellWK * nDug);
  if (modActive(s, 'flood')) target -= 2;
  b.interiorTempC += (target - b.interiorTempC) * (1 - Math.exp(-1 / THERMAL.tauH));
  const tIn = b.interiorTempC;
  r.tempMin = Math.min(r.tempMin, tIn);

  // ── Agua ──
  const infData = sv.infection?.stage === 'activa' ? INFECTIONS[sv.infection.kind] : null;
  let infWater = infData ? infData.waterLossLPerH * (sv.infection!.severity / 50) : 0;
  if (infWater > 0 && sv.infection!.kind === 'gastro' && (s.inv.sroActivo ?? 0) > 0) infWater *= 0.35;
  const need =
    WATER.drinkNeedLPerDay / 24 +
    (int === 'pesado' ? WATER.extraPerHeavyHourL : 0) +
    (Math.max(0, tIn - 26) * WATER.extraPerHotDegreeL) / 24 +
    infWater;
  const ration = WATER.rations[s.plan.water];
  const tap = mainsUp(s);
  const drinkWant = ration.drink / 24 + (s.plan.water !== 'minima' ? Math.min(sv.waterDeficitL, 0.12) : 0) + infWater;
  const drunk = tap ? drinkWant : Math.min(drinkWant, Math.max(0, s.inv.agua));
  if (!tap) s.inv.agua -= drunk;
  r.waterUsedL += tap ? 0 : drunk;
  sv.waterDeficitL = Math.max(0, sv.waterDeficitL + need - drunk);

  // Higiene: usa agua no potable primero
  const hygWant = ration.hygiene / 24;
  let hygGot = 0;
  if (hygWant > 0) {
    if (tap) hygGot = hygWant;
    else {
      const raw = Math.min(s.inv.aguaBruta ?? 0, hygWant);
      s.inv.aguaBruta -= raw;
      const pot = Math.min(Math.max(0, s.inv.agua), hygWant - raw);
      s.inv.agua -= pot;
      hygGot = raw + pot;
      r.waterUsedL += pot;
    }
  }
  const letrina = has(b, 'letrina');
  const kit = (s.inv.higiene ?? 0) > 0;
  if (hygWant > 0 && hygGot >= hygWant * 0.9) sv.hygiene = Math.min(100, sv.hygiene + (kit ? 2 : 1.2));
  else sv.hygiene -= (WATER.hygieneDrainPerDay / 24) * (letrina ? MODULES.letrina.hygieneDrainMult! : 1) * (kit ? 0.6 : 1);
  if (modActive(s, 'flood')) sv.hygiene -= 0.6;
  sv.hygiene = clamp(sv.hygiene, 0, 100);
  if (kit) s.inv.higiene = Math.max(0, s.inv.higiene - 1 / (CONSUMPTION.higieneKitDays * 24));

  // ── Frío ──
  const insul =
    ((s.inv.ropa_termica ?? 0) > 0 ? THERMO.gear.ropa_termica : 0) +
    ((s.inv.mantas ?? 0) > 0 ? THERMO.gear.mantas : 0) +
    (sleeping && (s.inv.saco_dormir ?? 0) > 0 ? THERMO.gear.saco_dormir : 0) +
    modValue(s, 'huddle');
  const comfort = THERMO.comfortBaseC - insul - THERMO.workHeatC[int];
  const stress = Math.max(0, comfort - tIn);
  const fedOk = sv.kcalBalance > ENERGY.deficitWeakKcal;
  const compensated = Math.min(stress, THERMO.compensatedStressC * (fedOk ? 1 : 0.5));
  const uncompensated = stress - compensated;
  if (uncompensated > 0) {
    sv.coreTempC -= uncompensated * THERMO.coolingPerStressDegreeH;
    r.hoursCold++;
  } else sv.coreTempC = Math.min(THERMO.normalC, sv.coreTempC + THERMO.rewarmPerH);

  // ── Comida ──
  const spent = ENERGY.kcalPerHour[int] + compensated * ENERGY.shiverKcalPerDegreeHour;
  let eaten = 0;
  if (MEAL_HOURS.includes(clockHour(s)) && !sleeping) {
    eaten = eat(s, ENERGY.rations[s.plan.food] / 3);
  }
  sv.kcalBalance = Math.min(2000, sv.kcalBalance + eaten - spent);
  r.kcalEaten += eaten;
  r.kcalSpent += spent;

  // ── Fatiga ──
  if (sleeping) {
    let q = has(b, 'dormitorio') ? 1 : 0.8;
    if (stress > 2) q *= 0.7;
    if (b.co2ppm > AIR.pelPpm) q *= 0.85;
    if (sv.morale < MORALE.insomniaBelow) q *= 0.75;
    sv.fatigue += FATIGUE.perHour.dormir * q;
  } else {
    let gain = act === 'guardia' ? FATIGUE.guardPerHour : FATIGUE.perHour[int];
    if (gain > 0 && infData) gain *= infData.fatigueMult;
    if (gain > 0 && b.co2ppm > 15000) gain *= 1.3;
    sv.fatigue += gain;
  }
  sv.fatigue = clamp(sv.fatigue, 0, 100);

  // ── Infecciones ──
  const insideP = modValue(s, 'infection');
  if (insideP > 0) {
    let p = insideP * (Q > 0 ? unfilteredQ / Q : 1);
    if (modActive(s, 'masks')) p *= 0.06; // FFP2 ≥94 % (niosh_n95)
    if (rng.chance(p) && infect(s, rng, 'pandemia')) log(s, 'log.contagio', undefined, 'warn');
  }
  if (sv.hygiene < 40 && !sv.infection) {
    const p = 0.0015 * (letrina ? MODULES.letrina.gastroRiskMult! : 1) * (modActive(s, 'flood') ? 3 : 1);
    if (rng.chance(p)) infect(s, rng, 'gastro');
  }
  if (sv.injuries > 20 && sv.hygiene < 50 && !sv.infection && rng.chance(0.002)) infect(s, rng, 'herida');
  if (sv.infection) {
    const inf = sv.infection;
    inf.hoursLeft--;
    if (inf.stage === 'incubando') {
      if (inf.hoursLeft <= 0) {
        inf.stage = 'activa';
        inf.hoursLeft = inf.activeTotal;
        log(s, 'log.sintomas', { kind: inf.kind }, 'bad');
      }
    } else {
      const t = 1 - inf.hoursLeft / inf.activeTotal;
      inf.severity = inf.peak * (t < 0.4 ? t / 0.4 : (1 - t) / 0.6);
      if (inf.hoursLeft <= 0) {
        if (inf.kind === 'pandemia') sv.immuneTo.push('pandemia');
        sv.infection = null;
        log(s, 'log.recuperado', { kind: inf.kind }, 'good');
      }
    }
  }
  if (sv.injuries > 0 && sv.hygiene > 50) sv.injuries = Math.max(0, sv.injuries - 0.05);

  // ── Salud ──
  const dmg: Partial<Record<DeathCause, number>> = {};
  if (sv.waterDeficitL > WATER.deficitModerateL) dmg.deshidratacion = (sv.waterDeficitL - WATER.deficitModerateL) * HEALTH.dehydrationDmgPerLH;
  if (sv.kcalBalance < ENERGY.deficitSevereKcal)
    dmg.inanicion = 0.03 + ((ENERGY.deficitSevereKcal - sv.kcalBalance) / 10000) * HEALTH.starvationDmgPer10kH;
  if (sv.acuteDoseMSv > DOSE.arsThreshold) dmg.radiacion = ((sv.acuteDoseMSv - DOSE.arsThreshold) / 1000) * DOSE.dmgPerSvH;
  if (sv.coreTempC < THERMO.hypothermiaC) dmg.hipotermia = (THERMO.hypothermiaC - sv.coreTempC) * HEALTH.hypothermiaDmgPerDegH;
  if (sv.infection && sv.infection.severity > 40) dmg.infeccion = (sv.infection.severity - 40) * HEALTH.infectionDmgPerSevH;
  if (sv.injuries > 30) dmg.heridas = (sv.injuries - 30) * HEALTH.injuryDmgPerPointH;
  if (b.co2ppm > AIR.stelPpm) dmg.asfixia = ((b.co2ppm - AIR.stelPpm) / 10000) * HEALTH.co2DmgPer10kH;

  let total = 0;
  for (const k of Object.keys(sv.damageLog) as DeathCause[]) sv.damageLog[k]! *= 0.97;
  for (const [k, v] of Object.entries(dmg) as [DeathCause, number][]) {
    total += v;
    sv.damageLog[k] = (sv.damageLog[k] ?? 0) + v;
  }
  if (total > 0) sv.health -= total;
  else if (
    sv.waterDeficitL < WATER.deficitThirstL &&
    sv.kcalBalance > ENERGY.deficitWeakKcal &&
    sv.fatigue < 85 &&
    sv.coreTempC > 36
  ) {
    const restMult = sleeping || int === 'reposo' ? HEALTH.restRegenMult : 1;
    const radMult = sv.acuteDoseMSv > DOSE.arsThreshold ? 0.4 : 1;
    const infirmary = has(b, 'enfermeria') && restMult > 1 ? 1.3 : 1;
    sv.health += HEALTH.regenPerH * restMult * radMult * infirmary;
  }
  sv.health = Math.min(100, sv.health);

  s.h += 1;
  r.toH = s.h;

  // Muertes instantáneas por umbral y por salud agotada
  if (sv.waterDeficitL >= WATER.deficitDeathL) return kill(s, 'deshidratacion');
  if (sv.kcalBalance <= ENERGY.deficitDeathKcal) return kill(s, 'inanicion');
  if (sv.coreTempC <= THERMO.deathC) return kill(s, 'hipotermia');
  if (sv.doseMSv >= DOSE.instantDeathMSv) return kill(s, 'radiacion');
  if (b.co2ppm >= AIR.deathPpm) return kill(s, 'asfixia');
  if (sv.health <= 0) {
    let cause: DeathCause = 'heridas';
    let max = -1;
    for (const [k, v] of Object.entries(sv.damageLog) as [DeathCause, number][]) if (v > max) [max, cause] = [v, k];
    return kill(s, cause);
  }
}

/** Eficiencia del trabajo según el estado del superviviente (0,2..1). */
export function efficiency(s: GameState): number {
  const sv = s.survivor;
  let e = 1;
  if (sv.fatigue > FATIGUE.slowThreshold) e *= 0.7;
  if (sv.morale < MORALE.breakdownBelow) e *= 0.5;
  if (sv.health < 40) e *= 0.6;
  if (sv.infection?.stage === 'activa' && sv.infection.severity > 50) e *= 0.6;
  if (sv.waterDeficitL > WATER.deficitModerateL) e *= 0.7;
  if (sv.coreTempC < THERMO.hypothermiaC) e *= 0.5;
  return clamp(e, 0.2, 1);
}
