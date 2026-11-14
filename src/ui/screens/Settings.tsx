/** Ajustes: audio, vibración, tamaño del texto, tutorial y datos. */
import { useState } from 'preact/hooks';
import { audio } from '../../audio/engine';
import { hapticsSupported, vibrate } from '../../platform/haptics';
import { remove } from '../../platform/storage';
import { emptyRecords } from '../../platform/records';
import { T } from '../../i18n';
import { Seg, Sheet, Toggle } from '../components/ui';
import { records, screen, showToast } from '../store';
import { settings, updateSettings } from '../settings';

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label class="field slider">
      <span>
        {label} <span class="muted num">{Math.round(value * 100)} %</span>
      </span>
      <input type="range" min="0" max="1" step="0.05" value={value} aria-label={label} onInput={(e) => onChange(Number((e.target as HTMLInputElement).value))} onChange={() => audio.play('confirm')} />
    </label>
  );
}

export function SettingsScreen({ onTutorial }: { onTutorial: () => void }) {
  const s = settings.value;
  const [confirmWipe, setConfirmWipe] = useState(false);
  return (
    <div class="screen settings">
      <header class="topbar">
        <button class="icon-btn" aria-label={T.common.back} onClick={() => (screen.value = 'menu')}>
          ←
        </button>
        <div class="tb-left">
          <b>{T.settings.title}</b>
        </div>
      </header>
      <div class="panel">
        <h3>{T.settings.audio}</h3>
        <div class="tog">
          {T.settings.mute} <Toggle label={T.settings.mute} on={s.muted} onChange={(v) => updateSettings({ muted: v })} />
        </div>
        <Slider label={T.settings.master} value={s.master} onChange={(v) => updateSettings({ master: v })} />
        <Slider label={T.settings.ambient} value={s.ambient} onChange={(v) => updateSettings({ ambient: v })} />
        <Slider label={T.settings.sfx} value={s.sfx} onChange={(v) => updateSettings({ sfx: v })} />
        <p class="small muted">{T.settings.audioNote}</p>
      </div>
      <div class="panel">
        <h3>{T.settings.haptics}</h3>
        <div class="tog">
          {T.settings.vibrate}{' '}
          <Toggle
            label={T.settings.vibrate}
            on={s.haptics}
            onChange={(v) => {
              updateSettings({ haptics: v });
              if (v) vibrate(40);
            }}
          />
        </div>
        {!hapticsSupported() && <p class="small muted">{T.settings.noHaptics}</p>}
      </div>
      <div class="panel">
        <h3>{T.settings.access}</h3>
        <label class="field">
          <span>{T.settings.textSize}</span>
          <Seg
            label={T.settings.textSize}
            value={String(s.textScale)}
            onChange={(v) => updateSettings({ textScale: Number(v) })}
            options={[
              { v: '1', label: 'A' },
              { v: '1.15', label: 'A+' },
              { v: '1.3', label: 'A++' },
            ]}
          />
        </label>
        <p class="small muted">{T.settings.motion}</p>
      </div>
      <div class="panel">
        <button class="btn wide" onClick={onTutorial}>
          {T.settings.tutorial}
        </button>
        <button class="btn ghost wide" onClick={() => setConfirmWipe(true)}>
          {T.settings.wipe}
        </button>
        <p class="small muted">v{__APP_VERSION__}</p>
      </div>
      {confirmWipe && (
        <Sheet
          title={T.settings.wipe}
          onClose={() => setConfirmWipe(false)}
          footer={
            <div class="row">
              <button class="btn ghost" onClick={() => setConfirmWipe(false)}>
                {T.common.cancel}
              </button>
              <button
                class="btn danger"
                onClick={() => {
                  void remove('records');
                  records.value = emptyRecords();
                  setConfirmWipe(false);
                  showToast(T.settings.wiped);
                }}
              >
                {T.common.yes}
              </button>
            </div>
          }
        >
          <p>{T.settings.wipeConfirm}</p>
        </Sheet>
      )}
    </div>
  );
}
