#!/usr/bin/env node
/**
 * Ajusta el logotipo: "Casanova" (la firma manuscrita) se reduce respecto a "MILLIMETER".
 *
 *   npm run logo:ajustar
 *
 * El logotipo oficial es un solo trazado (ver vectorizar-logo.mjs). Aqui se separa por posicion:
 * los trazos de la fila superior son MILLIMETER y se dejan intactos; los de la inferior son
 * Casanova y se escalan (ESCALA_CASANOVA) alrededor de su centro horizontal, sin deformar ni
 * cambiar de tipografia: es el mismo dibujo, mas pequeno. Despues se recorta el viewBox al
 * contenido para que el logotipo no lleve aire sobrante debajo.
 *
 * Entrada:  brand/logo-trazado-base.json   (trazado ORIGINAL, sin tocar; lo escribe vectorizar-logo)
 * Salidas:  src/assets/logo-path.json      (lo consumen Logo.astro, Base.astro y generar-og.mjs)
 *           public/brand/logo-blanco.svg, logo-negro.svg, logo-organizacion.png
 *
 * Es idempotente: siempre parte del trazado base, asi que repetirlo no encoge Casanova dos veces.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const BASE = path.join(ROOT, 'brand', 'logo-trazado-base.json');
const OUT_JSON = path.join(ROOT, 'src', 'assets', 'logo-path.json');
const OUT_PUB = path.join(ROOT, 'public', 'brand');

/** Tamano de Casanova respecto al original (1 = sin cambio). 0,78 = "algo mas reducido". */
const ESCALA_CASANOVA = 0.78;
/** Desplazamiento vertical de Casanova, en unidades del viewBox: acerca la firma a MILLIMETER
 *  para que la separacion siga pareciendo la misma al encogerla. */
const SUBIDA_CASANOVA = 6;
/** Los trazos cuyo borde superior este por debajo de esta ordenada (viewBox original) son Casanova. */
const LIMITE_FILA = 120;
/** Aire en el borde inferior tras recortar. */
const MARGEN = 1;

const base = JSON.parse(await fs.readFile(BASE, 'utf8'));

/* -------- 1. leer el trazado relativo (m, c, l) como subtrazados en coordenadas absolutas -------- */

const subs = [];
let cx = 0;
let cy = 0;
let cur = null;
for (const [, cmd, cuerpo] of base.d.matchAll(/([mcl])([^mcl]*)/g)) {
  const n = (cuerpo.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
  if (cmd === 'm') {
    cx += n[0];
    cy += n[1];
    cur = { segs: [{ c: 'M', p: [[cx, cy]] }] };
    subs.push(cur);
    for (let i = 2; i < n.length; i += 2) {
      cx += n[i];
      cy += n[i + 1];
      cur.segs.push({ c: 'L', p: [[cx, cy]] });
    }
  } else if (cmd === 'l') {
    for (let i = 0; i < n.length; i += 2) {
      cx += n[i];
      cy += n[i + 1];
      cur.segs.push({ c: 'L', p: [[cx, cy]] });
    }
  } else {
    for (let i = 0; i < n.length; i += 6) {
      const p = [
        [cx + n[i], cy + n[i + 1]],
        [cx + n[i + 2], cy + n[i + 3]],
        [cx + n[i + 4], cy + n[i + 5]],
      ];
      cur.segs.push({ c: 'C', p });
      cx = p[2][0];
      cy = p[2][1];
    }
  }
}

const puntos = (s) => s.segs.flatMap((g) => g.p);
const minY = (s) => Math.min(...puntos(s).map((p) => p[1]));
const casanova = subs.filter((s) => minY(s) > LIMITE_FILA);
const millimeter = subs.filter((s) => minY(s) <= LIMITE_FILA);
if (!casanova.length || !millimeter.length) throw new Error('No se pudo separar MILLIMETER de Casanova');

/* -------- 2. escalar Casanova alrededor de su centro horizontal y su borde superior -------- */

const cas = casanova.flatMap(puntos);
const ax = (Math.min(...cas.map((p) => p[0])) + Math.max(...cas.map((p) => p[0]))) / 2;
const ay = Math.min(...cas.map((p) => p[1]));
const mover = ([x, y]) => [ax + (x - ax) * ESCALA_CASANOVA, ay + (y - ay) * ESCALA_CASANOVA - SUBIDA_CASANOVA];
for (const s of casanova) for (const g of s.segs) g.p = g.p.map(mover);

/* -------- 3. escribir de nuevo en relativo, con una cifra decimal solo donde hace falta -------- */

const r1 = (v) => Math.round(v * 10) / 10;
const num = (v) => String(r1(v));
const unir = (vals) => vals.map((v, i) => (i === 0 || v < 0 ? num(v) : ' ' + num(v))).join('');

let px = 0;
let py = 0;
let d = '';
for (const s of [...millimeter, ...casanova]) {
  for (const g of s.segs) {
    // Cada punto se redondea en ABSOLUTO y se resta del punto actual ya redondeado: sin error
    // acumulado. Los puntos de control de una `c` se miden desde el INICIO del segmento.
    const rel = [];
    for (const [x, y] of g.p) rel.push(r1(r1(x) - px), r1(r1(y) - py));
    d += (g.c === 'M' ? 'm' : g.c === 'L' ? 'l' : 'c') + unir(rel);
    const [lx, ly] = g.p[g.p.length - 1];
    px = r1(lx);
    py = r1(ly);
  }
}

const todos = [...millimeter, ...casanova].flatMap(puntos);
const W = base.width;
const H = Math.ceil(Math.max(...todos.map((p) => p[1])) + MARGEN);

await fs.writeFile(
  OUT_JSON,
  JSON.stringify({ viewBox: `0 0 ${W} ${H}`, width: W, height: H, ratio: +(W / H).toFixed(4), d }) + '\n',
  'utf8',
);

const svg = (fill) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="MILLIMETER by Casanova"><path fill="${fill}" fill-rule="evenodd" d="${d}"/></svg>\n`;

await fs.mkdir(OUT_PUB, { recursive: true });
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

console.log(`  Casanova al ${Math.round(ESCALA_CASANOVA * 100)} %, viewBox ${W}x${H} (antes ${base.width}x${base.height})`);
console.log(`  Trazado: ${(d.length / 1024).toFixed(1)} kB`);
console.log('  ok  src/assets/logo-path.json · public/brand/logo-blanco.svg · logo-negro.svg · logo-organizacion.png');
