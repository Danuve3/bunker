import { render } from 'preact';
import { App } from './ui/App';
import { boot } from './ui/store';
import { listenInstall, registerSW } from './pwa/register';
import { initAudioUi } from './ui/feedback';
import '@fontsource/pixelify-sans/latin-400.css';
import '@fontsource/pixelify-sans/latin-600.css';
import '@fontsource/silkscreen/latin-400.css';
import '@fontsource/silkscreen/latin-700.css';
import './ui/theme.css';

listenInstall();
registerSW();
void boot().then(() => {
  initAudioUi();
  render(<App />, document.getElementById('app')!);
});
