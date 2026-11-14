/** Aplicación de efectos declarativos (eventos, crisis finales, efectos diferidos). */
import { COVER, MODULES } from '../data/modules';
import { doorStrength, has, shelterCell, working } from './bunker';
import { outdoorDoseRate, outdoorInfection } from './env';
import { addFood, loseFoodPct, removeKcal } from './food';
import { clamp, log } from './log';
import type { Rng } from './rng';
import { infect } from './sim';
import type { EffectSpec, GameState, SpecialEffect } from './types';

export function applyEffects(s: GameState, rng: Rng, effects: EffectSpec[]) {
  for (const e of effects) applyEffect(s, rng, e);
}

function applyEffect(s: GameState, rng: Rng, e: EffectSpec) {
  const sv = s.survivor;
  switch (e.k) {
    case 'inv':
      s.inv[e.id] = Math.max(0, (s.inv[e.id] ?? 0) + e.n);
      break;
    case 'water':
      s.inv.agua = Math.max(0, (s.inv.agua ?? 0) + e.n);
      break;
    case 'rawWater':
      s.inv.aguaBruta = Math.max(0, (s.inv.aguaBruta ?? 0) + e.n);
      break;
    case 'fuel':
      s.inv.diesel = Math.max(0, (s.inv.diesel ?? 0) + e.n);
      break;
    case 'food':
      if (e.kcal < 0) removeKcal(s, -e.kcal);
      else addFood(s, e.food ?? 'conserva_plato', e.kcal, s.h + 24 * 365);
      break;
    case 'foodLossPct': {
      const lost = loseFoodPct(s, e.pct);
      if (lost > 0) log(s, 'log.comida_perdida', { kcal: Math.round(lost) }, 'warn');
      break;
    }
    case 'stat': {
      const max = 100;
      sv[e.stat] = clamp(sv[e.stat] + e.n, 0, max);
      break;
    }
    case 'dose':
      sv.doseMSv += e.mSv;
      sv.acuteDoseMSv += e.mSv;
      break;
    case 'co2':
      s.bunker.co2ppm = Math.max(420, s.bunker.co2ppm + e.ppm);
      break;
    case 'infect':
      if (rng.chance(e.p) && infect(s, rng, e.kind)) log(s, 'log.contagio', undefined, 'warn');
      break;
    case 'mod':
      s.threat.mods.push({ fromH: s.h, toH: s.h + e.hours, kind: e.kind, value: e.value });
      break;
    case 'fallout': {
      const base = s.threat.fallout[0]?.r1 ?? 300;
      s.threat.fallout.push({ atH: s.h, r1: base * e.r1Mult });
      break;
    }
    case 'breakModule': {
      const pool = s.bunker.modules.filter((m) => !m.broken && (!e.type || m.type === e.type));
      if (pool.length) {
        const m = rng.pick(pool);
        m.broken = true;
        m.condition = Math.min(m.condition, 0.2);
        log(s, 'log.averia', { module: m.type }, 'bad');
      }
      break;
    }
    case 'wear':
      for (const m of s.bunker.modules) if (!e.type || m.type === e.type) m.condition = Math.max(0, m.condition - e.n);
      break;
    case 'chance': {
      const ok = rng.chance(e.p);
      applyEffects(s, rng, ok ? e.then : e.else ?? []);
      const key = ok ? e.textThen : e.textElse;
      if (key) log(s, `card.${key}`, undefined, ok ? 'warn' : 'info');
      break;
    }
    case 'delay':
      s.delayed.push({ atH: s.h + e.hours, effects: e.effects, text: e.text });
      break;
    case 'log':
      log(s, e.key);
      break;
    case 'cover': {
      const c = shelterCell(s.bunker).c;
      s.bunker.coverCm[c] = Math.min(COVER.maxCm, (s.bunker.coverCm[c] ?? 0) + e.cm);
      break;
    }
    case 'special':
      special(s, rng, e.id);
      break;
  }
}

/** Efectos que dependen del estado (no expresables como datos simples). */
function special(s: GameState, rng: Rng, id: SpecialEffect) {
  const sv = s.survivor;
  switch (id) {
    case 'robbed': {
      const k = loseFoodPct(s, rng.int(20, 35));
      const w = Math.round((s.inv.agua ?? 0) * 0.15);
      s.inv.agua -= w;
      sv.injuries = clamp(sv.injuries + rng.int(5, 15), 0, 100);
      sv.morale = clamp(sv.morale - 6, 0, 100);
      log(s, 'log.robado', { kcal: Math.round(k), agua: w }, 'bad');
      break;
    }
    case 'peek': {
      // Asomarse 10 minutos al exterior: dosis a la intemperie y contagio.
      const d = outdoorDoseRate(s) * (10 / 60);
      sv.doseMSv += d;
      sv.acuteDoseMSv += d;
      log(s, 'log.asomarse', { mSv: d.toFixed(1) }, d > 20 ? 'bad' : 'info');
      if (rng.chance(outdoorInfection(s) * 2)) infect(s, rng, 'pandemia');
      break;
    }
    case 'assault_hide': {
      const p = clamp(0.8 - s.visibility * 0.03 - s.noise24 * 0.02, 0.15, 0.9);
      if (rng.chance(p)) log(s, 'log.asalto_escondido', undefined, 'good');
      else assaultFight(s, rng, 0);
      break;
    }
    case 'assault_resist':
      assaultFight(s, rng, 0.1);
      break;
    case 'flood':
    case 'flood_bail': {
      // El agua entra en el nivel más bajo: daña módulos y moja suministros.
      const dmgMult = id === 'flood_bail' ? 0.4 : 1;
      const lowest = Math.max(...s.bunker.modules.map((m) => m.r), shelterCell(s.bunker).r);
      for (const m of s.bunker.modules)
        if (m.r === lowest) {
          m.condition = Math.max(0, m.condition - 0.4 * dmgMult);
          if (m.condition < 0.25 && MODULES[m.type].powerW) m.broken = true;
        }
      if (id === 'flood') log(s, 'log.inundacion', undefined, 'warn');
      else {
        loseFoodPct(s, 6);
        log(s, 'log.achique', undefined, 'info');
      }
      s.threat.mods.push({ fromH: s.h, toH: s.h + 24, kind: 'flood', value: 1 });
      s.inv.aguaBruta = (s.inv.aguaBruta ?? 0) + 40;
      break;
    }
    case 'storm_electronics': {
      // Dato real: las tormentas geomagnéticas dañan sobre todo equipos conectados a líneas largas.
      const exposed = s.bunker.modules.filter((m) => ['baterias', 'radio', 'ventilacion'].includes(m.type) && !m.broken);
      let broke = 0;
      for (const m of exposed) if (rng.chance(0.15)) { m.broken = true; broke++; log(s, 'log.averia', { module: m.type }, 'bad'); }
      if (!broke) log(s, 'log.tormenta_ok', undefined, 'good');
      break;
    }
    case 'co_risk': {
      // Quemar combustible en interior: riesgo de monóxido de carbono (cdc_co).
      const vent = has(s.bunker, 'ventilacion') && s.plan.fan;
      if (rng.chance(vent ? 0.15 : 0.5)) {
        sv.health = Math.max(1, sv.health - rng.int(15, 30));
        sv.fatigue = clamp(sv.fatigue + 20, 0, 100);
        log(s, 'log.monoxido', undefined, 'bad');
      }
      break;
    }
  }
}

function assaultFight(s: GameState, rng: Rng, bonus: number) {
  const guard = s.plan.night === 'guardia' ? 0.1 : 0;
  const p = clamp(doorStrength(s.bunker) + bonus + guard, 0.05, 0.95);
  if (rng.chance(p)) {
    log(s, 'log.asalto_rechazado', undefined, 'good');
    s.survivor.fatigue = clamp(s.survivor.fatigue + 15, 0, 100);
  } else {
    const inj = rng.int(15, 40);
    s.survivor.injuries = clamp(s.survivor.injuries + inj, 0, 100);
    s.survivor.health = Math.max(1, s.survivor.health - inj / 2);
    const lost = loseFoodPct(s, rng.int(25, 45));
    const w = Math.round((s.inv.agua ?? 0) * 0.3);
    s.inv.agua -= w;
    const fuel = Math.round((s.inv.diesel ?? 0) * 0.5);
    s.inv.diesel -= fuel;
    for (const m of working(s.bunker, 'puerta_blindada')) m.condition = Math.max(0, m.condition - 0.4);
    log(s, 'log.asalto_saqueado', { kcal: Math.round(lost), agua: w, diesel: fuel }, 'bad');
  }
  s.survivor.morale = clamp(s.survivor.morale - 8, 0, 100);
}
