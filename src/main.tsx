import { render } from 'preact';
import './ui/theme.css';

function Hello() {
  return (
    <main class="boot">
      <h1>BÚNKER</h1>
      <p>Preparando el refugio…</p>
    </main>
  );
}

render(<Hello />, document.getElementById('app')!);
