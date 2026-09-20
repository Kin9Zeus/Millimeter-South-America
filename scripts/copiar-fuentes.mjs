#!/usr/bin/env node
/**
 * Copia de node_modules a public/fonts/ solo los archivos de tipografía que el
 * sitio usa de verdad, con nombres estables.
 *
 *   npm run fuentes
 *
 * Por qué no usar directamente el CSS de @fontsource:
 *
 *  1. Sus archivos llevan hash de build, así que no se pueden precargar con
 *     `<link rel="preload">` — y el h1 del hero (Bodoni) es el elemento LCP.
 *     Sin precarga, el texto aparece primero en la fuente de reserva y salta.
 *  2. Su CSS declara todos los subconjuntos (latin, latin-ext, math, symbols).
 *     El español y el inglés caben enteros en `latin`: el resto es ruido en el
 *     CSS crítico.
 *
 * Hay que volver a ejecutarlo si se actualiza alguna dependencia de @fontsource.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'public', 'fonts');
const MOD = path.join(ROOT, 'node_modules');

const FUENTES = [
  {
    from: '@fontsource-variable/bodoni-moda/files/bodoni-moda-latin-wght-normal.woff2',
    to: 'bodoni-moda-variable.woff2',
    nota: 'Display. Variable 400-900. Es el LCP: se precarga.',
  },
  {
    from: '@fontsource-variable/instrument-sans/files/instrument-sans-latin-wght-normal.woff2',
    to: 'instrument-sans-variable.woff2',
    nota: 'Cuerpo. Variable 400-700. Se precarga.',
  },
  {
    from: '@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2',
    to: 'ibm-plex-mono-400.woff2',
    nota: 'Cotas y datos.',
  },
  {
    from: '@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2',
    to: 'ibm-plex-mono-500.woff2',
    nota: 'Cotas y datos, medium.',
  },
];

await fs.mkdir(OUT, { recursive: true });

let total = 0;
for (const f of FUENTES) {
  const src = path.join(MOD, f.from);
  const dest = path.join(OUT, f.to);
  try {
    await fs.copyFile(src, dest);
    const { size } = await fs.stat(dest);
    total += size;
    console.log(`  ok  ${f.to.padEnd(30)} ${String(Math.round(size / 1024)).padStart(4)} kB  — ${f.nota}`);
  } catch {
    console.error(`  ERROR  no se encontró ${f.from}`);
    console.error('         ¿Se actualizó @fontsource y cambió la ruta? Revisa node_modules.');
    process.exitCode = 1;
  }
}

console.log(`\n  Total en la ruta crítica: ${Math.round(total / 1024)} kB\n`);
