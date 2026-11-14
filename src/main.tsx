import { render } from 'preact';
import { App } from './ui/App';
import { boot } from './ui/store';
import { listenInstall, registerSW } from './pwa/register';
import { initAudioUi } from './ui/feedback';
import './ui/theme.css';

listenInstall();
registerSW();
void boot().then(() => {
  initAudioUi();
  render(<App />, document.getElementById('app')!);
});
