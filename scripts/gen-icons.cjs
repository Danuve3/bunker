/**
 * Genera los iconos PWA (192, 512, maskable), apple-touch-icon, favicon y las
 * pantallas de inicio de iOS a partir de un SVG dibujado aquí.
 * Uso: node scripts/gen-icons.cjs   (requiere Playwright con Chromium)
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const OUT = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(OUT, { recursive: true });

function iconSvg({ rounded }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b2622"/><stop offset="1" stop-color="#6b5a44"/></linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.3" r="0.8"><stop offset="0" stop-color="#f2a93b" stop-opacity="0.75"/><stop offset="1" stop-color="#f2a93b" stop-opacity="0.08"/></radialGradient>
    <clipPath id="c"><rect width="512" height="512" rx="${rounded ? 104 : 0}"/></clipPath>
  </defs>
  <g clip-path="url(#c)">
    <rect width="512" height="512" fill="#15120e"/>
    <rect width="512" height="214" fill="url(#sky)"/>
    <circle cx="390" cy="92" r="22" fill="#e9d8a6" opacity="0.55"/>
    <rect y="214" width="512" height="298" fill="#5a4030"/>
    <path d="M0 300 Q128 290 256 300 T512 300" stroke="#47321f" stroke-width="10" fill="none"/>
    <path d="M0 420 Q128 410 256 422 T512 418" stroke="#47321f" stroke-width="10" fill="none"/>
    <rect y="206" width="512" height="12" fill="#6b7a43"/>
    <path d="M168 210 V146 L256 92 L344 146 V210 Z" fill="#2a2420" stroke="#0e0c0a" stroke-width="6" stroke-linejoin="round"/>
    <rect x="236" y="164" width="40" height="46" fill="#5a3b28" stroke="#0e0c0a" stroke-width="5"/>
    <rect x="150" y="282" width="212" height="122" rx="6" fill="#221d18" stroke="#b3a796" stroke-width="10"/>
    <rect x="155" y="287" width="202" height="112" fill="url(#glow)"/>
    <g stroke="#b3a796" stroke-width="7">
      <line x1="186" y1="214" x2="186" y2="398"/><line x1="212" y1="214" x2="212" y2="398"/>
      <line x1="186" y1="246" x2="212" y2="246"/><line x1="186" y1="282" x2="212" y2="282"/><line x1="186" y1="318" x2="212" y2="318"/><line x1="186" y1="354" x2="212" y2="354"/>
    </g>
    <circle cx="286" cy="322" r="15" fill="#e0b48a" stroke="#0e0c0a" stroke-width="4"/>
    <path d="M268 342 H304 L309 384 H263 Z" fill="#f2a93b" stroke="#0e0c0a" stroke-width="4"/>
  </g>
</svg>`;
}

function splashHtml(w, h) {
  const icon = Math.round(Math.min(w, h) * 0.32);
  return `<html><body style="margin:0;width:${w}px;height:${h}px;background:#15120e;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${Math.round(icon * 0.12)}px;font-family:'Arial Black',Impact,sans-serif">
  <div style="width:${icon}px;height:${icon}px">${iconSvg({ rounded: true })}</div>
  <div style="color:#f2a93b;font-size:${Math.round(icon * 0.28)}px;letter-spacing:0.22em;padding-left:0.22em">BÚNKER</div>
  </body></html>`;
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  async function render(html, w, h, file) {
    await page.setViewportSize({ width: w, height: h });
    await page.setContent(html);
    await page.screenshot({ path: path.join(OUT, file), omitBackground: true });
  }
  const svgPage = (svg, size) => `<html><body style="margin:0;background:transparent">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`;
  await render(svgPage(iconSvg({ rounded: true }), 192), 192, 192, 'icon-192.png');
  await render(svgPage(iconSvg({ rounded: true }), 512), 512, 512, 'icon-512.png');
  await render(svgPage(iconSvg({ rounded: false }), 512), 512, 512, 'icon-maskable-512.png');
  await render(svgPage(iconSvg({ rounded: false }), 192), 192, 192, 'icon-maskable-192.png');
  await render(svgPage(iconSvg({ rounded: false }), 180), 180, 180, 'apple-touch-icon.png');
  fs.writeFileSync(path.join(OUT, 'favicon.svg'), iconSvg({ rounded: true }));
  // Pantallas de inicio iOS (portrait): [ancho CSS, alto CSS, ratio]
  const SPLASH = [
    [375, 667, 2], [414, 896, 2], [375, 812, 3], [390, 844, 3], [393, 852, 3], [414, 896, 3], [428, 926, 3], [430, 932, 3], [744, 1133, 2], [820, 1180, 2], [1024, 1366, 2],
  ];
  const links = [];
  for (const [w, h, r] of SPLASH) {
    const file = `splash-${w * r}x${h * r}.png`;
    await render(splashHtml(w * r, h * r), w * r, h * r, file);
    links.push(`    <link rel="apple-touch-startup-image" href="icons/${file}" media="(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${r}) and (orientation: portrait)" />`);
  }
  console.log('Enlaces para index.html:\n' + links.join('\n'));
  await browser.close();
  console.log('Iconos generados en', OUT);
})();
