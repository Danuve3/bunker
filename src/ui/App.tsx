import { game, screen, toast } from './store';
import { applyUpdate, updateReady } from '../pwa/register';
import { T } from '../i18n';
import { Briefing, HowTo, Menu } from './screens/Menu';
import { PrepScreen } from './screens/Prep';
import { CrisisScreen } from './screens/Crisis';
import { CardModal, DeathScreen, PhaseEnd } from './screens/Overlays';
import { RecordsScreen } from './screens/Records';
import { SettingsScreen } from './screens/Settings';
import { startTutorial } from './store';

export function App() {
  return (
    <>
      <Main />
      {updateReady.value && (
        <div class="update-banner" role="status">
          <span>{T.pwa.update}</span>
          <button class="btn primary" onClick={applyUpdate}>
            {T.pwa.reload}
          </button>
        </div>
      )}
      {toast.value && (
        <div class="toast" role="status">
          {toast.value}
        </div>
      )}
    </>
  );
}

function Main() {
  if (screen.value === 'howto') return <HowTo />;
  if (screen.value === 'records') return <RecordsScreen />;
  if (screen.value === 'settings') return <SettingsScreen onTutorial={() => startTutorial()} />;
  const s = game.value;
  if (screen.value === 'menu' || !s) return <Menu />;
  switch (s.stage) {
    case 'briefing':
      return <Briefing s={s} />;
    case 'prep':
      return <PrepScreen s={s} />;
    case 'dead':
      return <DeathScreen s={s} />;
    default:
      return (
        <>
          <CrisisScreen s={s} />
          {(s.stage === 'event' || s.stage === 'boss') && <CardModal s={s} />}
          {s.stage === 'phaseEnd' && <PhaseEnd s={s} />}
        </>
      );
  }
}
