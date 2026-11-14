import { render } from 'preact';
import { App } from './ui/App';
import { boot } from './ui/store';
import './ui/theme.css';

void boot().then(() => render(<App />, document.getElementById('app')!));
