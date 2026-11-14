import { game, screen, toast } from './store';
import { Briefing, HowTo, Menu } from './screens/Menu';
import { PrepScreen } from './screens/Prep';
import { CrisisScreen } from './screens/Crisis';
import { CardModal, DeathScreen, PhaseEnd } from './screens/Overlays';
import { RecordsScreen } from './screens/Records';

export function App() {
  return (
    <>
      <Main />
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
