#!/usr/bin/env node
/**
 * Genera las tarjetas para compartir enlaces (Open Graph / Twitter), una por página e idioma.
 *
 *   npm run og
 *
 * Cada tarjeta compone la foto de esa sección (public/media/hero/still-*.jpg), el logotipo
 * oficial, el titular real de la página en Bodoni y la cota de cobre. Se dibujan con Chrome sin
 * ventana para poder usar las mismas tipografías autoalojadas de la web: con `sharp` solo se
 * dispone de tipografías de reserva del sistema. Requiere Chrome o Chromium instalado, pero
 * solo al REGENERAR: los JPG resultantes se versionan y el build no depende de esto.
 *
 * Salida: public/og/<clave>-<idioma>.jpg (1200x630, < 300 kB: WhatsApp descarta las más pesadas).
 * Head.astro elige el archivo por la ruta de la página; si falta, usa la de la portada.
 *
 * Variable opcional: CHROME_PATH (ruta al ejecutable si no está en un sitio habitual).
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const PUB = path.join(ROOT, 'public');
const OUT = path.join(PUB, 'og');

const LOGO = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/assets/logo-path.json'), 'utf8'));

const CANDIDATOS = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);
const CHROME = CANDIDATOS.find((p) => fs.existsSync(p));
if (!CHROME) {
  console.error('No encuentro Chrome/Chromium. Instálalo o define CHROME_PATH.');
  process.exit(1);
}

/** Fondo de cada tarjeta. Contacto y portada comparten la foto de marca (el canto de la placa). */
const FONDO = {
  home: 'still',
  tecnologia: 'still-tecnologia',
  aplicaciones: 'still-aplicaciones',
  materiales: 'still-materiales',
  proyectos: 'still-proyectos',
  surAmerica: 'still-sur-america',
  contacto: 'still',
};

/** Textos: los titulares son los de cada página (PageHero / Hero), no una versión aparte. */
const TARJETAS = {
  home: {
    es: { eyebrow: 'MILLIMETER by Casanova', title: ['Un milímetro', 'de piedra natural.'], measure: '1 – 5 mm', foot: 'Hasta 90 % menos peso  ·  Curvas reales  ·  Menos de 0,5 % de sílice' },
    en: { eyebrow: 'MILLIMETER by Casanova', title: ['One millimetre', 'of natural stone.'], measure: '1 – 5 mm', foot: 'Up to 90% lighter  ·  Real curves  ·  Under 0.5% silica' },
  },
  tecnologia: {
    es: { eyebrow: 'Tecnología', title: ['Lo que cambia', 'es el espesor.'], measure: '1 mm ← → 5 mm' },
    en: { eyebrow: 'Technology', title: ['What changes', 'is the thickness.'], measure: '1 mm ← → 5 mm' },
  },
  aplicaciones: {
    es: { eyebrow: 'Aplicaciones', title: ['Ocho sitios donde', 'antes no cabía.'], measure: '8 aplicaciones' },
    en: { eyebrow: 'Applications', title: ['Eight places stone', 'could not go.'], measure: '8 applications' },
  },
  materiales: {
    es: { eyebrow: 'Materiales', title: ['La misma piedra.', 'Sin el espesor.'], measure: '12 acabados' },
    en: { eyebrow: 'Materials', title: ['The same stone.', 'Without the thickness.'], measure: '12 finishes' },
  },
  proyectos: {
    es: { eyebrow: 'Proyectos', title: ['Obra real.', 'Precisión real.'], measure: '1 mm + 5 mm' },
    en: { eyebrow: 'Projects', title: ['Real work.', 'Real precision.'], measure: '1 mm + 5 mm' },
  },
  surAmerica: {
    es: { eyebrow: 'Sur América', title: ['Un interlocutor,', 'no un catálogo.'], measure: 'Representación oficial' },
    en: { eyebrow: 'South America', title: ['A person,', 'not a catalogue.'], measure: 'Official representation' },
  },
  contacto: {
    es: { eyebrow: 'Contacto', title: ['Cuéntanos qué', 'estás proyectando.'], measure: 'Respuesta de un arquitecto' },
    en: { eyebrow: 'Contact', title: ['Tell us what', 'you are designing.'], measure: 'An architect replies' },
  },
};

const REGION = { es: 'SUR AMÉRICA', en: 'SOUTH AMERICA' };
const url = (rel) => pathToFileURL(path.join(PUB, rel)).href;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function html(clave, lang, t) {
  const fondo = url(`media/hero/${FONDO[clave]}.jpg`);
  const larga = Math.max(...t.title.map((l) => l.length));
  const size = Math.min(96, Math.floor(1010 / (larga * 0.47)));
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:'Bodoni Moda';src:url('${url('fonts/bodoni-moda-variable.woff2')}');font-weight:400 900;font-style:normal}
@font-face{font-family:'Instrument Sans';src:url('${url('fonts/instrument-sans-variable.woff2')}');font-weight:400 700}
@font-face{font-family:'Plex Mono';src:url('${url('fonts/ibm-plex-mono-400.woff2')}');font-weight:400}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1200px;height:630px;overflow:hidden;background:#0a0a0b}
.c{position:relative;width:1200px;height:630px;color:#edeae4}
.bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.sc{position:absolute;inset:0;background:
  linear-gradient(90deg,rgba(10,10,11,.96) 0%,rgba(10,10,11,.86) 34%,rgba(10,10,11,.32) 72%,rgba(10,10,11,.12) 100%),
  linear-gradient(0deg,rgba(10,10,11,.85) 0%,rgba(10,10,11,0) 46%),
  linear-gradient(180deg,rgba(10,10,11,.7) 0%,rgba(10,10,11,0) 26%)}
.logo{position:absolute;left:64px;top:44px;width:200px;height:56px}
.reg{position:absolute;right:64px;top:62px;font:400 16px 'Plex Mono',monospace;letter-spacing:.3em;color:#d08a54}
.hl{position:absolute;left:64px;right:64px;top:118px;height:1px;background:rgba(174,100,50,.55)}
.b{position:absolute;left:64px;bottom:56px;right:64px}
.ey{font:400 19px 'Plex Mono',monospace;letter-spacing:.22em;text-transform:uppercase;color:#d08a54;margin-bottom:22px}
h1{font:400 ${size}px/.94 'Bodoni Moda',Georgia,serif;letter-spacing:-.035em;text-shadow:0 0 34px rgba(10,10,11,.55)}
.cota{display:flex;align-items:center;gap:18px;margin-top:30px;font:400 19px 'Plex Mono',monospace;letter-spacing:.2em;color:#d08a54}
.cota i{display:block;position:relative;width:240px;height:1px;background:#ae6432}
.cota i:before,.cota i:after{content:'';position:absolute;top:-12px;width:1px;height:25px;background:#ae6432}
.cota i:before{left:0}.cota i:after{right:0}
.foot{margin-top:22px;font:400 22px 'Instrument Sans',sans-serif;color:rgba(237,234,228,.68)}
</style></head><body><div class="c">
<img class="bg" src="${fondo}"><div class="sc"></div>
<svg class="logo" viewBox="${LOGO.viewBox}"><path fill="#edeae4" fill-rule="evenodd" d="${LOGO.d}"/></svg>
<div class="reg">${REGION[lang]}</div><div class="hl"></div>
<div class="b">
<div class="ey">${esc(t.eyebrow)}</div>
<h1>${t.title.map(esc).join('<br>')}</h1>
<div class="cota"><i></i><span>${esc(t.measure)}</span></div>
${t.foot ? `<div class="foot">${esc(t.foot)}</div>` : ''}
</div></div></body></html>`;
}

fs.mkdirSync(OUT, { recursive: true });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-og-'));
const perfil = path.join(tmp, 'perfil');
let hechas = 0;

for (const [clave, idiomas] of Object.entries(TARJETAS)) {
  for (const [lang, t] of Object.entries(idiomas)) {
    const archivo = path.join(tmp, `${clave}-${lang}.html`);
    const png = path.join(tmp, `${clave}-${lang}.png`);
    fs.writeFileSync(archivo, html(clave, lang, t));
    execFileSync(
      CHROME,
      [
        '--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files',
        '--force-device-scale-factor=1', '--window-size=1200,630', '--virtual-time-budget=6000',
        `--user-data-dir=${perfil}`, `--screenshot=${png}`, pathToFileURL(archivo).href,
      ],
      { stdio: 'ignore', timeout: 60000 },
    );
    // Calidad adaptativa: la mas alta que quede por debajo de 300 kB.
    let buf;
    for (const q of [86, 82, 78, 74, 70]) {
      buf = await sharp(png).resize(1200, 630).jpeg({ quality: q, mozjpeg: true, progressive: true }).toBuffer();
      if (buf.length <= 300 * 1024) break;
    }
    fs.writeFileSync(path.join(OUT, `${clave}-${lang}.jpg`), buf);
    console.log(`  ok  og/${clave}-${lang}.jpg  ${Math.round(buf.length / 1024)} kB`);
    hechas++;
  }
}
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\nListo: ${hechas} tarjetas de 1200x630.`);
