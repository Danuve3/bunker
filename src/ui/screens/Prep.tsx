/** Fase 0: preparación contrarreloj. */
import { useState } from 'preact/hooks';
import { clockHour } from '../../core/env';
import { totalKcal } from '../../core/food';
import { available, checkBuy, hoursLeft, price, projectHoursEstimate, tankRoom, tripHours } from '../../core/prep';
import { storageInfo } from '../../core/bunker';
import { excavatorActive } from '../../core/projects';
import type { GameState } from '../../core/types';
import { ITEMS, RECOMMENDED, SHOPS, type ShopId } from '../../data/items';
import { C, T, fmt, itemName, moduleName, num } from '../../i18n';
import { BunkerView } from '../bunker/BunkerCanvas';
import { Sheet, Stepper } from '../components/ui';
import { act, selectedCell, sheet } from '../store';
import { CellSheet } from './CellSheet';
import { PixelIcon } from '../components/PixelIcon';
import { TopBar } from './TopBar';

const SHOP_ORDER: ShopId[] = ['super', 'ferreteria', 'farmacia', 'outdoor', 'gasolinera', 'online', 'alquiler'];

function ShopSheet({ s, shop }: { s: GameState; shop: ShopId }) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const ids = Object.keys(ITEMS).filter((id) => ITEMS[id].shop === shop && !ITEMS[id].hidden);
  const lot = RECOMMENDED[shop];
  const chk = checkBuy(s, shop, cart);
  const total = Object.entries(cart).reduce((t, [id, q]) => t + price(s, id) * q, 0);
  const hrs = tripHours(shop, cart);
  const close = () => (sheet.value = null);
  return (
    <Sheet
      title={C.shops[shop].name}
      onClose={close}
      footer={
        <div class="cart-foot">
          <div class="small">
            <b class="num">{num(total, 2)} €</b> · {T.prep.trip}: <b class="num">{num(hrs, 1)} h</b>
            {!chk.ok && chk.reason !== 'vacio' && <span class="tone-bad"> · {T.prep.reasons[chk.reason]}</span>}
          </div>
          <button
            class="btn primary"
            disabled={!chk.ok}
            onClick={() => {
              act({ t: 'buy', shop, cart });
              close();
            }}
          >
            {T.prep.buy}
          </button>
        </div>
      }
    >
      <StorageBar s={s} />
      {lot && (
        <button
          class="btn wide"
          onClick={() => setCart(Object.fromEntries(Object.entries(lot).map(([id, q]) => [id, Math.min(q, available(s, id))])))}
        >
          {T.prep.lot}
          <span class="small muted">{T.prep.lotDesc}</span>
        </button>
      )}
      {shop === 'online' && <p class="small tone-warn">{T.prep.online}</p>}
      {shop === 'alquiler' && <p class="small">{T.prep.excavator}</p>}
      <ul class="shop-list">
        {ids.map((id) => {
          const av = available(s, id);
          const q = cart[id] ?? 0;
          return (
            <li key={id} class={av <= 0 ? 'soldout' : ''}>
              <div class="shop-item">
                <b>{itemName(id)}</b>
                <p class="small">{C.items[id]?.desc}</p>
                <p class="small muted">
                  <span class="num">{num(price(s, id), 2)} €</span> · {av > 0 ? `${T.prep.stock} ${av}` : T.prep.soldOut}
                </p>
              </div>
              <Stepper label={itemName(id)} value={q} max={av} onChange={(v) => setCart({ ...cart, [id]: v })} />
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}

export function StorageBar({ s }: { s: GameState }) {
  const st = storageInfo(s);
  const pct = st.cap > 0 ? Math.min(100, (st.used / st.cap) * 100) : 100;
  return (
    <div class="storage">
      <div class="bar-top">
        <span>
          {T.prep.storage} <span class="muted">(1 = 1 L o 1 kg)</span>
        </span>
        <span class="num">
          {num(st.used)} / {num(st.cap)}
          {st.waterExtra > 0 && ` · depósitos ${num(Math.min(st.waterL, st.waterExtra))}/${num(st.waterExtra)} L`}
          {st.foodExtra > 0 && ` · despensa ${num(Math.min(st.foodKg, st.foodExtra))}/${num(st.foodExtra)} kg`}
        </span>
      </div>
      <div class="bar-track">
        <div class={`bar-fill tone-${pct > 95 ? 'bad' : pct > 75 ? 'warn' : 'good'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Inventory({ s }: { s: GameState }) {
  const rows = Object.entries(s.inv).filter(
    ([k, v]) => v > 0.05 && !['banera', 'filtroHoras', 'sroActivo', 'bidon_lleno'].includes(k),
  );
  return (
    <ul class="inv">
      <li>
        <span>Comida</span>
        <b class="num">{num(totalKcal(s))} kcal</b>
      </li>
      {rows.map(([k, v]) => (
        <li key={k}>
          <span>{itemName(k)}</span>
          <b class="num">{num(v, v % 1 ? 1 : 0)}</b>
        </li>
      ))}
    </ul>
  );
}

export function PrepScreen({ s }: { s: GameState }) {
  const [tab, setTab] = useState<'shop' | 'build' | 'home'>('shop');
  const left = hoursLeft(s);
  const proj = s.bunker.project;
  const exc = s.excavatorUntilH > s.h;
  const urgent = left <= 6;
  return (
    <div role="main" class="screen prep">
      <TopBar
        left={
          <span class={urgent ? 'tone-bad blink' : ''}>
            {T.time.left} <b class="num">{left} h</b>
          </span>
        }
        mid={<span class="num">{String(clockHour(s)).padStart(2, '0')}:00</span>}
        right={<b class="num">{num(s.money, 0)} €</b>}
      />
      <BunkerView s={s} buildMode={tab === 'build'} />
      <nav class="tabs" role="tablist">
        {(['shop', 'build', 'home'] as const).map((k) => (
          <button key={k} role="tab" aria-selected={tab === k} class={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
            {T.prep.tabs[k]}
          </button>
        ))}
      </nav>
      <div class="panel">
        {tab === 'shop' && (
          <>
            <p class="small muted">{T.prep.panic}</p>
            <div class="shop-grid">
              {SHOP_ORDER.map((id) => (
                <button key={id} class="shop-btn" onClick={() => (sheet.value = `shop:${id}`)}>
                  <span class="shop-icon">
                    <PixelIcon name={id} size={40} />
                  </span>
                  <span>{C.shops[id].name}</span>
                  <span class="small muted">{num(SHOPS[id].tripH, 2)} h</span>
                </button>
              ))}
            </div>
          </>
        )}
        {tab === 'build' && (
          <>
            {exc && (
              <p class="small tone-good">
                {excavatorActive(s) ? T.prep.excavatorOn : fmt(T.prep.excavatorSoon, { h: s.excavatorFromH - s.h })} (hasta {String(clockHour(s, s.excavatorUntilH)).padStart(2, '0')}:00)
              </p>
            )}
            {proj ? (
              <div class="project">
                <p>
                  <b>{T.build.current}:</b> {C.projects[proj.kind]} {proj.module ? moduleName(proj.module) : ''} (nivel −{proj.r})
                </p>
                <div class="bar-track">
                  <div class="bar-fill tone-info" style={{ width: `${100 * (1 - proj.hoursLeft / proj.hoursTotal)}%` }} />
                </div>
                <p class="small muted">≈ {projectHoursEstimate(s)} h de trabajo pendientes</p>
                <div class="row">
                  <button class="btn" onClick={() => act({ t: 'work', hours: 1 })}>
                    {T.prep.work1}
                  </button>
                  <button class="btn" onClick={() => act({ t: 'work', hours: 4 })}>
                    4 h
                  </button>
                  <button class="btn primary" onClick={() => act({ t: 'work', hours: 9999 })}>
                    {T.prep.workUntil}
                  </button>
                </div>
                <button class="btn ghost small-btn" onClick={() => act({ t: 'cancelProject' })}>
                  {T.prep.cancel}
                </button>
              </div>
            ) : (
              <p class="muted">{T.build.tapCell}</p>
            )}
          </>
        )}
        {tab === 'home' && (
          <>
            <ul class="actions">
              {(['banera', 'deposito', 'dormir', 'descansar'] as const).map((id) => {
                if (id === 'deposito' && storageInfo(s).waterExtra <= 0) return null;
                const disabled = (id === 'banera' && !!s.inv.banera) || (id === 'deposito' && tankRoom(s) < 1);
                return (
                  <li key={id}>
                    <button class="btn wide" disabled={disabled} onClick={() => act({ t: 'prep', id })}>
                      <b>{T.prep.actions[id].label}</b>
                      <span class="small">{T.prep.actions[id].desc}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <p class="small muted">
              Cansancio: <b class="num">{Math.round(s.survivor.fatigue)}</b> / 100
            </p>
            <StorageBar s={s} />
            <h3>Inventario</h3>
            <Inventory s={s} />
          </>
        )}
      </div>
      <div class="cta">
        <button class="btn danger wide" onClick={() => (sheet.value = 'seal')}>
          {T.prep.actions.encerrarse.label}
        </button>
      </div>
      {sheet.value === 'seal' && (
        <Sheet
          title={T.prep.actions.encerrarse.label}
          onClose={() => (sheet.value = null)}
          footer={
            <div class="row">
              <button class="btn ghost" onClick={() => (sheet.value = null)}>
                {T.common.cancel}
              </button>
              <button
                class="btn danger"
                onClick={() => {
                  sheet.value = null;
                  act({ t: 'prep', id: 'encerrarse' });
                }}
              >
                {T.prep.actions.encerrarse.label}
              </button>
            </div>
          }
        >
          <p>{fmt(T.prep.sealConfirm, { h: left })}</p>
        </Sheet>
      )}
      {sheet.value?.startsWith('shop:') && <ShopSheet s={s} shop={sheet.value.slice(5) as ShopId} />}
      {selectedCell.value && <CellSheet s={s} />}
    </div>
  );
}
