/** Hoja de una celda del búnker: información, excavar, construir, cubrir. */
import { canDig, cellAt, cellPF, digHours, moduleAt, underHouse } from '../../core/bunker';
import { checkProject, excavatorActive } from '../../core/projects';
import type { GameState, ModuleType } from '../../core/types';
import { EXCAVATOR } from '../../data/items';
import { DIG, HYDRO, MODULES } from '../../data/modules';
import { GRID } from '../../data/environment';
import { C, T, fmt, itemName, moduleName, num } from '../../i18n';
import { Sheet } from '../components/ui';
import { act, selectedCell } from '../store';

const BUILDABLE = (Object.keys(MODULES) as ModuleType[]).filter((m) => (MODULES[m].minPhase ?? 0) < 50);

function Req({ s, req }: { s: GameState; req: Record<string, number> }) {
  return (
    <span class="req">
      {Object.entries(req).map(([id, n]) => (
        <span key={id} class={(s.inv[id] ?? 0) >= n ? 'ok' : 'miss'}>
          {itemName(id)} ×{n}
        </span>
      ))}
    </span>
  );
}

export function CellSheet({ s }: { s: GameState }) {
  const sel = selectedCell.value;
  if (!sel) return null;
  const { c, r } = sel;
  const b = s.bunker;
  const close = () => (selectedCell.value = null);
  const prep = s.stage === 'prep';
  const kind = cellAt(b, c, r)!;
  const m = moduleAt(b, c, r);
  const proj = b.project;
  const depth = `${num((r - 1) * GRID.cellHeightM, 1)}–${num(r * GRID.cellHeightM, 1)} m`;

  const start = (kind: 'excavar' | 'construir' | 'cubrir', module?: ModuleType, work = false) => {
    act({ t: 'project', kind, c, r, module });
    if (work && prep) act({ t: 'work', hours: 9999 });
    close();
  };

  let body;
  if (kind !== 'hueco') {
    const chk = checkProject(s, 'excavar', c, r);
    const hrs = digHours(s, c, r);
    const exc = prep && excavatorActive(s);
    body = (
      <>
        <p class="muted">
          {T.build.soil}: <b>{C.cells[kind]}</b> · {T.build.depth}: {depth}
        </p>
        {canDig(b, c, r) ? (
          <div class="option">
            <div>
              <b>{T.build.dig}</b>
              <p class="small">{fmt(T.build.digDesc, { h: hrs })}{exc ? ` · ≈${Math.ceil(hrs / (kind === 'roca' ? EXCAVATOR.rockMult : EXCAVATOR.speedMult))} h con miniexcavadora` : ''}</p>
              <Req s={s} req={DIG.shoring} />
              {!(s.inv.herramientas > 0) && <p class="small tone-warn">Sin pala ni pico: 2,5× más lento.</p>}
            </div>
            <div class="option-btns">
              {prep && (
                <button class="btn" disabled={!chk.ok} onClick={() => start('excavar', undefined, true)}>
                  Excavar ya
                </button>
              )}
              <button class="btn ghost" disabled={!chk.ok} onClick={() => start('excavar')}>
                {prep ? 'Solo empezar' : 'Empezar obra'}
              </button>
            </div>
            {!chk.ok && <p class="small tone-bad">{T.build.reasons[chk.reason as keyof typeof T.build.reasons]}</p>}
          </div>
        ) : (
          <p class="muted">{T.build.reasons.no_adyacente}.</p>
        )}
      </>
    );
  } else {
    const coverChk = r === 1 ? checkProject(s, 'cubrir', c, r) : null;
    body = (
      <>
        <p class="muted">
          {T.build.depth}: {depth} · {T.build.pf}: <b>{num(cellPF(b, c, r), 0)}</b>
        </p>
        {m ? (
          <div class="module-info">
            <h3>
              {moduleName(m.type)} {m.broken && <span class="tag tone-bad">{T.build.broken}</span>}
            </h3>
            <p class="small">{C.modules[m.type].desc}</p>
            <p class="small">
              {T.build.condition}: {Math.round(m.condition * 100)} %
              {m.type === 'hidroponico' && ` · crecimiento ${m.growth ?? 0}/${HYDRO.growDays} días`}
            </p>
          </div>
        ) : proj && proj.c === c && proj.r === r ? (
          <p>{T.build.current}</p>
        ) : (
          <>
            <h3>{T.build.module}</h3>
            <ul class="options">
              {BUILDABLE.map((mt) => {
                const chk = checkProject(s, 'construir', c, r, mt);
                return (
                  <li key={mt} class="option">
                    <div>
                      <b>{moduleName(mt)}</b> <span class="small muted">· {fmt(T.build.hours, { h: MODULES[mt].hours })}</span>
                      <p class="small">{C.modules[mt].desc}</p>
                      <Req s={s} req={MODULES[mt].requires} />
                    </div>
                    <div class="option-btns">
                      <button class="btn" disabled={!chk.ok} onClick={() => start('construir', mt, true)}>
                        {prep ? 'Construir' : 'Empezar'}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
        {coverChk && (
          <div class="option">
            <div>
              <b>{T.build.cover}</b>
              <p class="small">
                {underHouse(b, c) ? T.build.coverDesc : T.build.coverDescGarden} · ahora {b.coverCm[c]} cm
              </p>
            </div>
            <div class="option-btns">
              <button class="btn" disabled={!coverChk.ok} onClick={() => start('cubrir', undefined, true)}>
                {prep ? 'Cubrir' : 'Empezar'}
              </button>
            </div>
            {!coverChk.ok && <p class="small tone-bad">{T.build.reasons[coverChk.reason as keyof typeof T.build.reasons]}</p>}
          </div>
        )}
      </>
    );
  }
  return (
    <Sheet title={`Nivel −${r} · columna ${c + 1}`} onClose={close}>
      {proj && !(proj.c === c && proj.r === r) && <p class="small tone-warn">{T.build.reasons.proyecto_en_curso}.</p>}
      {body}
    </Sheet>
  );
}
