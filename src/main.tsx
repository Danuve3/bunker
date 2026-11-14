import { render } from 'preact';
import { App } from './ui/App';
import { boot } from './ui/store';
import { listenInstall, registerSW } from './pwa/register';
import './ui/theme.css';

listenInstall();
registerSW();
void boot().then(() => render(<App />, document.getElementById('app')!));
