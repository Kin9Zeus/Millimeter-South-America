#!/usr/bin/env node
/**
 * Genera los PNG derivados (iconos PWA, apple-touch-icon) a partir del SVG de
 * marca, y una imagen Open Graph de reserva.
 *
 *   npm run iconos
 *
 * La imagen OG definitiva la genera el cliente con Nano Banana Pro
 * (ver 05-Contenido/Prompts de imagen - Nano Banana Pro.md, pieza OG-01).
 * Esta es la que evita que un enlace compartido salga sin previsualizacion
 * mientras tanto.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const PUB = path.join(ROOT, 'public');

const OBSIDIAN = '#0a0a0b';
const COPPER = '#ae6432';
const BONE = '#edeae4';

// Logotipo oficial ya vectorizado. Si no existe, hay que ejecutar `npm run logo`.
const LOGO = JSON.parse(await fs.readFile(path.join(ROOT, 'src', 'assets', 'logo-path.json'), 'utf8'));

/** El icono, escalado: la cota crece con el lienzo. */
function iconSvg(size, padding = 0) {
  const s = 32;
  const inner = s - padding * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${s} ${s}">
    <rect width="${s}" height="${s}" fill="${OBSIDIAN}"/>
    <g transform="translate(${padding} ${padding}) scale(${inner / s})">
      <rect x="6" y="15" width="20" height="2" fill="${BONE}"/>
      <rect x="5" y="9" width="1.5" height="14" fill="${COPPER}"/>
      <rect x="25.5" y="9" width="1.5" height="14" fill="${COPPER}"/>
    </g>
  </svg>`;
}

/**
 * OG de reserva. Sin depender de una tipografia concreta: el mensaje lo lleva
 * la cota, que es geometria pura, y el texto va en la familia serif del
 * sistema de renderizado.
 */
const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#151311"/>
      <stop offset="55%" stop-color="#0a0a0b"/>
      <stop offset="100%" stop-color="#1a120c"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>

  <!-- Logotipo oficial (trazado de scripts/vectorizar-logo.mjs) + region -->
  <svg x="80" y="34" width="216" height="60" viewBox="${LOGO.viewBox}">
    <path fill="${BONE}" fill-rule="evenodd" d="${LOGO.d}"/>
  </svg>
  <text x="1120" y="80" text-anchor="end" fill="${COPPER}" font-family="monospace" font-size="17" letter-spacing="5.5">SUR AMÉRICA</text>
  <rect x="80" y="112" width="1040" height="1" fill="${COPPER}" opacity="0.5"/>

  <!-- Titular -->
  <text x="80" y="300" fill="${BONE}" font-family="Georgia, 'Times New Roman', serif" font-size="104" letter-spacing="-3">Un milímetro</text>
  <text x="80" y="400" fill="${BONE}" font-family="Georgia, 'Times New Roman', serif" font-size="104" letter-spacing="-3">de piedra natural.</text>

  <!-- La cota: elemento firma -->
  <g transform="translate(80 470)">
    <rect x="0" y="0" width="1" height="26" fill="${COPPER}"/>
    <rect x="0" y="12.5" width="300" height="1" fill="${COPPER}"/>
    <rect x="299" y="0" width="1" height="26" fill="${COPPER}"/>
    <text x="318" y="21" fill="#d08a54" font-family="monospace" font-size="19" letter-spacing="3.5">1 - 5 mm</text>
  </g>

  <text x="80" y="566" fill="${BONE}" opacity="0.6" font-family="sans-serif" font-size="23">Hasta 90 % menos peso  ·  Curvas reales  ·  Menos de 0,5 % de sílice</text>
</svg>`;

const targets = [
  { file: 'icons/icon-192.png', svg: iconSvg(192), size: 192 },
  { file: 'icons/icon-512.png', svg: iconSvg(512), size: 512 },
  // Maskable: el area segura es el 80% central, asi que la marca se encoge.
  { file: 'icons/icon-maskable-512.png', svg: iconSvg(512, 5), size: 512 },
  { file: 'icons/apple-touch-icon.png', svg: iconSvg(180), size: 180 },
];

await fs.mkdir(path.join(PUB, 'icons'), { recursive: true });
await fs.mkdir(path.join(PUB, 'og'), { recursive: true });

for (const t of targets) {
  await sharp(Buffer.from(t.svg)).png({ compressionLevel: 9 }).toFile(path.join(PUB, t.file));
  console.log(`  ok  ${t.file}  (${t.size}x${t.size})`);
}

await sharp(Buffer.from(ogSvg)).jpeg({ quality: 88, mozjpeg: true }).toFile(path.join(PUB, 'og/millimeter-og.jpg'));
console.log('  ok  og/millimeter-og.jpg  (1200x630)');

// favicon.ico para navegadores y agregadores antiguos que lo piden a pelo.
await sharp(Buffer.from(iconSvg(48))).png().toFile(path.join(PUB, 'favicon-48.png'));
console.log('  ok  favicon-48.png');

console.log('\nListo. La imagen OG definitiva se genera aparte: ver la pieza OG-01 del vault.');
