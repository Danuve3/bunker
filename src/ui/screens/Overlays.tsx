/** Cartas (eventos y crisis finales), fin de fase y muerte. */
import { choiceAvailable } from '../../core/cards';
import { score } from '../../core/game';
import type { GameState } from '../../core/types';
import { ALL_CARDS } from '../../data/cards';
import { SOURCES } from '../../data/sources';
import { phaseLength } from '../../data/threats';
import { C, T, fmt, itemName, logText, moduleName, num } from '../../i18n';
import { act, newBest, randomSeed, showToast, start, toMenu } from '../store';
import { PixelIcon } from '../components/PixelIcon';
import { PixelCanvas } from '../components/PixelCanvas';
import { BANNER_H, BANNER_W, BannerRenderer, type BannerKind } from '../pixel/banner';

const banner = new BannerRenderer();
export function Banner({ s, kind, id }: { s: GameState; kind: BannerKind; id: string }) {
  return <PixelCanvas w={BANNER_W} h={BANNER_H} class="banner" draw={(cv, t, reduced) => banner.render(cv, s, kind, id, t, reduced)} deps={[s, kind, id]} />;
}
import { seedUrl, shareText } from '../../platform/share';

export function CardModal({ s }: { s: GameState }) {
  if (!s.pending) return null;
  const card = ALL_CARDS[s.pending.id];
  const txt = C.cards[card.id];
  const boss = card.kind === 'boss';
  const src = card.fact ? SOURCES[card.fact] : null;
  return (
    <div class="overlay">
      <article class={`card ${boss ? 'boss' : ''}`} role="dialog" aria-modal="true" aria-labelledby="card-title">
        <Banner s={s} kind={boss ? 'boss' : card.encounter ? 'encounter' : 'event'} id={card.id} />
        <p class="card-kind">{boss ? T.card.boss : card.encounter ? T.card.encounter : T.card.event}</p>
        <h2 id="card-title">{txt.title}</h2>
        <p class="card-text">{txt.text}</p>
        <div class="choices">
          {card.choices.map((ch) => {
            const ok = choiceAvailable(s, ch);
            const reqs = [
              ...Object.entries(ch.requires ?? {}).map(([id, n]) => `${itemName(id)} ×${n}`),
              ...(ch.requiresModule ? [moduleName(ch.requiresModule)] : []),
            ];
            return (
              <button key={ch.id} class="btn choice" disabled={!ok} onClick={() => act({ t: 'choose', choice: ch.id })}>
                <span>{txt.choices?.[ch.id]?.label ?? ch.id}</span>
                {reqs.length > 0 && (
                  <span class={`small ${ok ? 'muted' : 'tone-bad'}`}>
                    {T.card.needs}: {reqs.join(', ')}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {txt.fact && (
          <details class="fact">
            <summary>
              <PixelIcon name="diario" size={16} /> {T.card.fact}
            </summary>
            <p>{txt.fact}</p>
            {src && (
              <p class="small">
                {T.card.source}:{' '}
                <a href={src.url} target="_blank" rel="noopener noreferrer">
                  {src.org} — {src.title}
                </a>
              </p>
            )}
          </details>
        )}
      </article>
    </div>
  );
}

export function PhaseEnd({ s }: { s: GameState }) {
  const notes = s.lastReport?.notes ?? [];
  return (
    <div class="overlay">
      <article class="card win" role="dialog" aria-modal="true">
        <Banner s={s} kind="win" id="win" />
        <p class="card-kind">{T.card.win}</p>
        <h2>{fmt(T.phaseEnd.title, { n: s.phase })}</h2>
        <p class="card-text">{T.phaseEnd.text}</p>
        {notes.length > 0 && (
          <ul class="log">
            {notes.slice(-6).map((e, i) => (
              <li key={i} class={`tone-${e.tone}`}>
                {logText(e)}
              </li>
            ))}
          </ul>
        )}
        {s.perkOffer?.length ? (
          <>
            <p class="small">
              {T.phaseEnd.pick} <span class="muted">({fmt(T.phaseEnd.next, { n: s.phase + 1, d: phaseLength(s.phase + 1) })})</span>
            </p>
            <div class="choices">
              {s.perkOffer.map((id) => (
                <button key={id} class="btn choice perk" onClick={() => act({ t: 'pickPerk', id })}>
                  <b>{C.perks[id]?.name}</b>
                  <span class="small">{C.perks[id]?.desc}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <button class="btn primary wide" onClick={() => act({ t: 'nextPhase' })}>
            {fmt(T.phaseEnd.next, { n: s.phase + 1, d: phaseLength(s.phase + 1) })}
          </button>
        )}
        {s.perks.length > 0 && (
          <p class="small muted">
            {T.phaseEnd.yourPerks}: {s.perks.map((p) => C.perks[p]?.name).join(' · ')}
          </p>
        )}
      </article>
    </div>
  );
}

async function shareRun(s: GameState) {
  const threat = s.threat.variant ? C.variants[s.threat.variant].name : C.threats[s.threat.primary].name;
  const text = fmt(s.mode === 'diaria' ? T.share.daily : T.share.normal, {
    days: s.day,
    phase: s.phase,
    threat,
    score: score(s),
    cause: C.causes[s.deathCause ?? 'heridas'],
    seed: s.seed,
  });
  const r = await shareText('BÚNKER', text, seedUrl(s.seed));
  if (r === 'copied') showToast(T.share.copied);
  else if (r === 'failed') showToast(T.share.failed);
}

export function DeathScreen({ s }: { s: GameState }) {
  const threat = s.threat.variant ? C.variants[s.threat.variant].name : C.threats[s.threat.primary].name;
  const last = s.log.slice(-6, -1);
  return (
    <div role="main" class="screen death">
      <div class="death-inner">
        <Banner s={s} kind="death" id="death" />
        <p class="card-kind">{threat}</p>
        <h1>{T.death.title}</h1>
        {newBest.value && (
          <p class="badge">
            <PixelIcon name="estrella" size={20} /> {T.death.newBest}
          </p>
        )}
        <p class="cause">{C.causes[s.deathCause ?? 'heridas']}</p>
        <dl class="report">
          <dt>{T.death.days}</dt>
          <dd class="num">{s.day}</dd>
          <dt>{T.death.phase}</dt>
          <dd class="num">{s.phase}</dd>
          {s.threat.primary === 'nuclear' && (
            <>
              <dt>{T.death.dose}</dt>
              <dd class="num">{num(s.survivor.doseMSv)} mSv</dd>
            </>
          )}
          <dt>{T.death.score}</dt>
          <dd class="num big">{score(s)}</dd>
          <dt>{T.death.seed}</dt>
          <dd class="num">{s.seed}</dd>
        </dl>
        <ul class="log">
          {last.map((e, i) => (
            <li key={i} class={`tone-${e.tone}`}>
              {logText(e)}
            </li>
          ))}
        </ul>
        <button class="btn wide" onClick={() => shareRun(s)}>
          {T.death.share}
        </button>
        <div class="row">
          <button class="btn ghost" onClick={toMenu}>
            {T.death.menu}
          </button>
          <button class="btn primary" onClick={() => start(randomSeed(), 'normal')}>
            {T.death.again}
          </button>
        </div>
      </div>
    </div>
  );
}
