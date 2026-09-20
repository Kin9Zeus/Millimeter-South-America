#!/usr/bin/env node
/**
 * Vectoriza el logotipo oficial (JPEG negro sobre blanco) a SVG.
 *
 *   npm install --no-save potrace
 *   npm run logo
 *
 * Por qué existe: el logotipo oficial solo está disponible como JPEG de 440x144,
 * sin transparencia y en negro. Sobre el fondo oscuro de la web no se puede
 * usar tal cual, y estirado se ve borroso. Vectorizado escala a cualquier
 * tamaño y hereda el color del contexto (`currentColor`), así que el mismo
 * archivo sirve en oscuro, en travertino y en el pie.
 *
 * `potrace` NO está en package.json a propósito: arrastra `jimp` -> `phin`,
 * con avisos de npm audit en una herramienta que se ejecuta una vez y nunca en
 * producción. Se instala con --no-save solo cuando hace falta regenerar.
 *
 * Si el cliente entrega el SVG original, este script deja de hacer falta:
 * sustituir `src/assets/logo-path.json` por el trazado real y borrarlo.
 *
 * Entrada:  brand/logo-oficial.jpg
 * Salidas:  src/assets/logo-path.json   (lo consume components/Logo.astro)
 *           public/brand/logo-blanco.svg, logo-negro.svg
 *           public/brand/logo-organizacion.png  (negro sobre blanco, para schema.org)
 *           brand/_vista-previa.png     (para revisar el trazado a ojo)
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

let potrace;
try {
  potrace = (await import('potrace')).default;
} catch {
  console.error('\n  Falta potrace. Instálalo sin guardarlo en el proyecto:\n');
  console.error('    npm install --no-save potrace\n');
  process.exit(1);
}

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'brand', 'logo-oficial.jpg');
const OUT_JSON = path.join(ROOT, 'src', 'assets', 'logo-path.json');
const OUT_PUB = path.join(ROOT, 'public', 'brand');

/** Factor de ampliación previo al trazado: más píxeles = curvas más suaves. */
const SCALE = 4;
/** Umbral de binarización. Alto para no perder los remates finos de la serif. */
const THRESHOLD = 150;

/* ---------------------------------------------------- 1. preparar la imagen */

const meta = await sharp(SRC).metadata();
console.log(`\n  Origen: ${meta.width}x${meta.height} ${meta.format}`);

// Ampliar con Lanczos y suavizar un pelo: elimina el ruido de compresión JPEG
// del original, que si no se traza como una orilla temblorosa.
const grande = await sharp(SRC)
  .greyscale()
  .resize({ width: meta.width * SCALE, kernel: 'lanczos3' })
  .blur(1.1)
  .threshold(THRESHOLD)
  .png()
  .toBuffer();

// Recortar el margen blanco: el viewBox tiene que ajustarse al logotipo, no al
// lienzo del JPEG, o el logotipo flota con aire desigual al maquetarlo.
const recortado = await sharp(grande).trim({ background: '#ffffff', threshold: 10 }).png().toBuffer();
const rm = await sharp(recortado).metadata();
console.log(`  Recortado: ${rm.width}x${rm.height}  (proporción ${(rm.width / rm.height).toFixed(2)}:1)`);

/* ------------------------------------------------------------ 2. vectorizar */

const svgCrudo = await new Promise((resolve, reject) => {
  potrace.trace(
    recortado,
    {
      turdSize: 12, // descarta motas menores que esto (ruido residual)
      alphaMax: 1.0, // 1.0 = esquinas suaves pero fieles; más alto redondea de más
      optCurve: true,
      optTolerance: 2.2, // menor = más fiel al original, más puntos
      blackOnWhite: true,
      threshold: 128, // ya está binarizado; esto solo evita reprocesar
    },
    (err, svg) => (err ? reject(err) : resolve(svg)),
  );
});

const d = [...svgCrudo.matchAll(/\sd="([^"]+)"/g)].map((m) => m[1]).join(' ');
if (!d) throw new Error('potrace no devolvió ningún trazado');

/**
 * Reescribe el trazado de potrace (absoluto, 4 cifras, con decimal) en
 * coordenadas RELATIVAS y ENTERAS a escala K.
 *
 * El peso del path no está en el número de curvas sino en cómo se escriben los
 * números: `1234.5 678.9` ocupa 12 caracteres, un delta relativo `-3 12` ocupa 5.
 * A 150 px de ancho, una unidad del viewBox (856 de ancho) mide ~0,17 px: el
 * redondeo a entero (error máximo 0,09 px) no se aprecia.
 *
 * Cada punto se redondea EN ABSOLUTO y se resta del punto anterior ya
 * redondeado, así el error no se acumula a lo largo del trazo.
 */
function compactar(dCrudo, k) {
  const num = (n) => Math.round(n * k);
  let cx = 0; // punto actual, ya redondeado
  let cy = 0;
  let out = '';
  // Une números omitiendo el espacio antes de un negativo: `c1-2 3` en vez de `c1 -2 3`.
  const unir = (vals) => vals.map((v, i) => (i === 0 || v < 0 ? String(v) : ' ' + v)).join('');

  for (const [, cmd, cuerpo] of dCrudo.matchAll(/([MCL])([^MCL]*)/g)) {
    const n = cuerpo.split(/[\s,]+/).filter(Boolean).map(Number);
    const paso = cmd === 'C' ? 6 : 2; // C = 3 puntos; M y L = 1 (L admite varios seguidos)
    const rel = [];
    for (let i = 0; i < n.length; i += paso) {
      for (let j = 0; j < paso; j += 2) {
        const ax = num(n[i + j]);
        const ay = num(n[i + j + 1]);
        rel.push(ax - cx, ay - cy);
        // Los puntos de control de una C se miden desde el inicio del segmento
        // (SVG), y solo el último mueve el punto actual.
        if (j === paso - 2) {
          cx = ax;
          cy = ay;
        }
      }
    }
    out += cmd.toLowerCase() + unir(rel);
  }
  return out;
}

/** Escala del viewBox final respecto a la imagen de trazado (que va a 4x). */
const K = 0.5;
const compacto = compactar(d, K);

const W = Math.ceil(rm.width * K);
const H = Math.ceil(rm.height * K);
const kb = (compacto.length / 1024).toFixed(1);
console.log(`  Trazado: ${kb} kB de path  (viewBox ${W}x${H})`);

/* --------------------------------------------------------------- 3. salidas */

await fs.mkdir(path.dirname(OUT_JSON), { recursive: true });
await fs.mkdir(OUT_PUB, { recursive: true });

await fs.writeFile(
  OUT_JSON,
  JSON.stringify({ viewBox: `0 0 ${W} ${H}`, width: W, height: H, ratio: +(W / H).toFixed(4), d: compacto }) + '\n',
  'utf8',
);

const svg = (fill) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="MILLIMETER by Casanova"><path fill="${fill}" fill-rule="evenodd" d="${compacto}"/></svg>\n`;

await fs.writeFile(path.join(OUT_PUB, 'logo-blanco.svg'), svg('#edeae4'), 'utf8');
await fs.writeFile(path.join(OUT_PUB, 'logo-negro.svg'), svg('#16140f'), 'utf8');

// schema.org pide un logotipo visible sobre blanco.
const margen = Math.round(W * 0.06);
await sharp(Buffer.from(svg('#16140f')), { density: 300 })
  .resize({ width: 1000 })
  .flatten({ background: '#ffffff' })
  .extend({ top: margen, bottom: margen, left: margen, right: margen, background: '#ffffff' })
  .png({ compressionLevel: 9 })
  .toFile(path.join(OUT_PUB, 'logo-organizacion.png'));

// Vista previa: lo trazado (blanco sobre obsidian) junto al original, para
// comparar a ojo si se perdió algún remate.
const previa = await sharp(Buffer.from(svg('#edeae4')), { density: 300 }).resize({ width: 1400 }).png().toBuffer();
const pm = await sharp(previa).metadata();
await sharp({
  create: { width: 1500, height: pm.height + 100, channels: 3, background: '#0a0a0b' },
})
  .composite([{ input: previa, left: 50, top: 50 }])
  .png()
  .toFile(path.join(ROOT, 'brand', '_vista-previa.png'));

console.log('\n  ok  src/assets/logo-path.json');
console.log('  ok  public/brand/logo-blanco.svg · logo-negro.svg · logo-organizacion.png');
console.log('  ok  brand/_vista-previa.png   <- míralo antes de dar el trazado por bueno\n');
