#!/usr/bin/env node
/**
 * Genera el favicon (SVG + ICO) y los PNG derivados (iconos PWA, apple-touch-icon).
 *
 *   npm run iconos
 *
 * El icono es un monograma "M" en serif de alto contraste (como el wordmark oficial) sobre
 * obsidiana, con la cota de cobre debajo: la firma gráfica del sitio. Está dibujado como
 * trazado y no como texto para que se vea igual en cualquier navegador y a 16 px.
 *
 * La imagen para compartir enlaces (Open Graph) NO se genera aquí: ver `npm run og`.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const PUB = path.join(ROOT, 'public');

const OBSIDIAN = '#0a0a0b';
const COPPER = '#ae6432';
const BONE = '#edeae4';

/** Contenido del icono en una cuadrícula de 64 (la M y la cota, centradas juntas). */
const MARCA = `<g transform="translate(0 -1.5)">
    <g fill="${BONE}">
      <path d="M12 13h9.5l13.6 27.2L36.5 43h-6.6L15 15.2V43H12z"/>
      <path d="M45.6 13H52v30h-6.4z"/>
      <path d="M34.6 43h3L47.4 13h-3z"/>
      <path d="M9.5 41.6H17V43H9.5zM43.2 41.6h11.2V43H43.2zM9.5 13H21v1.4H9.5z"/>
    </g>
    <path fill="${COPPER}" d="M12 50h40v1.8H12zM12 47.6h1.7v6.6H12zM50.3 47.6H52v6.6h-1.7z"/>
  </g>`;

/**
 * @param size   lado en px del render
 * @param opts   padding: 0-1, fracción de margen extra (iconos "maskable": el SO recorta ~20 %)
 *               rounded: esquinas redondeadas (solo para el favicon SVG; los PNG van a sangre)
 */
function iconSvg(size, { padding = 0, rounded = false } = {}) {
  const k = 1 - padding * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">
  <rect width="64" height="64"${rounded ? ' rx="14"' : ''} fill="${OBSIDIAN}"/>
  <g transform="translate(32 32) scale(${k}) translate(-32 -32)">
  ${MARCA}
  </g>
</svg>
`;
}

const png = (svg, size) => sharp(Buffer.from(svg), { density: Math.max(72, size * 4) }).resize(size, size).png({ compressionLevel: 9 });

await fs.mkdir(path.join(PUB, 'icons'), { recursive: true });

// --- favicon.svg: el que usan los navegadores modernos (esquinas redondeadas) ---
await fs.writeFile(path.join(PUB, 'favicon.svg'), iconSvg(64, { rounded: true }));
console.log('  ok  favicon.svg');

// --- PNG de la PWA y de iOS ---
const targets = [
  { file: 'icons/icon-192.png', size: 192, padding: 0 },
  { file: 'icons/icon-512.png', size: 512, padding: 0 },
  // Maskable: el área segura es el 80 % central, así que la marca se encoge.
  { file: 'icons/icon-maskable-512.png', size: 512, padding: 0.1 },
  { file: 'icons/apple-touch-icon.png', size: 180, padding: 0 },
];
for (const t of targets) {
  await png(iconSvg(t.size, { padding: t.padding }), t.size).toFile(path.join(PUB, t.file));
  console.log(`  ok  ${t.file}  (${t.size}x${t.size})`);
}

// --- favicon.ico real, con 16, 32 y 48 px (PNG dentro del contenedor ICO) ---
// Los agregadores, lectores de feeds y navegadores antiguos piden /favicon.ico a pelo.
const tamanos = [16, 32, 48];
const imagenes = await Promise.all(tamanos.map((s) => png(iconSvg(s, { rounded: true }), s).toBuffer()));
const cab = Buffer.alloc(6);
cab.writeUInt16LE(0, 0); // reservado
cab.writeUInt16LE(1, 2); // tipo: icono
cab.writeUInt16LE(tamanos.length, 4);
let offset = 6 + 16 * tamanos.length;
const entradas = tamanos.map((s, i) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(s, 0); // ancho
  e.writeUInt8(s, 1); // alto
  e.writeUInt16LE(1, 4); // planos
  e.writeUInt16LE(32, 6); // bits por pixel
  e.writeUInt32LE(imagenes[i].length, 8);
  e.writeUInt32LE(offset, 12);
  offset += imagenes[i].length;
  return e;
});
await fs.writeFile(path.join(PUB, 'favicon.ico'), Buffer.concat([cab, ...entradas, ...imagenes]));
console.log(`  ok  favicon.ico  (${tamanos.join(', ')} px)`);

// PNG suelto de 48 px (se conserva por compatibilidad con enlaces antiguos).
await png(iconSvg(48, { rounded: true }), 48).toFile(path.join(PUB, 'favicon-48.png'));
console.log('  ok  favicon-48.png');

console.log('\nListo. La imagen para compartir enlaces se genera con `npm run og`.');
