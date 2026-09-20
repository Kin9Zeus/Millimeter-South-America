#!/usr/bin/env node
/**
 * Comprueba que el HTML compilado es compatible con la CSP de server.mjs (`script-src 'self'`).
 *
 *   npm run build && npm run verificar
 *
 * Un script incrustado (<script> con el codigo dentro), un manejador `onclick="…"` o un enlace
 * `javascript:` NO se ejecuta en produccion: el navegador lo bloquea en silencio. En `astro dev`
 * no hay CSP, asi que el fallo solo aparece una vez desplegado. Ya rompio el menu movil y el
 * aviso de cookies: Astro incrusta por defecto los scripts de componente menores de 4 kB
 * (se evita con `vite.build.assetsInlineLimit: 0`, ver astro.config.mjs).
 *
 * Se permite <script type="application/ld+json">: es un dato, no se ejecuta.
 * Sale con codigo 1 si encuentra algo, para que falle la CI.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const RAIZ = path.resolve(import.meta.dirname, '..', 'dist', 'client');

async function* htmls(dir) {
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const ruta = path.join(dir, e.name);
    if (e.isDirectory()) yield* htmls(ruta);
    else if (e.name.endsWith('.html')) yield ruta;
  }
}

const problemas = [];
let paginas = 0;

try {
  await fs.access(RAIZ);
} catch {
  console.error('No existe dist/client. Ejecuta `npm run build` antes.');
  process.exit(1);
}

for await (const archivo of htmls(RAIZ)) {
  paginas++;
  const html = await fs.readFile(archivo, 'utf8');
  const rel = path.relative(RAIZ, archivo);

  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const [, atributos, cuerpo] = m;
    if (/\bsrc\s*=/.test(atributos)) continue; // externo: cabe en 'self'
    if (/type\s*=\s*["']?application\/(ld\+)?json/i.test(atributos)) continue; // dato
    if (!cuerpo.trim()) continue;
    problemas.push(`${rel}: script incrustado (${cuerpo.trim().length} bytes): ${cuerpo.trim().replace(/\s+/g, ' ').slice(0, 70)}…`);
  }
  for (const m of html.matchAll(/\son[a-z]+\s*=\s*["']/gi)) {
    problemas.push(`${rel}: manejador de evento en linea (${m[0].trim()})`);
  }
  if (/href\s*=\s*["']\s*javascript:/i.test(html)) problemas.push(`${rel}: enlace javascript:`);
}

if (problemas.length) {
  console.error(`\n✖ ${problemas.length} problema(s) con la CSP en ${paginas} paginas:\n`);
  for (const p of problemas.slice(0, 20)) console.error('  - ' + p);
  console.error('\nEsos scripts NO se ejecutan en produccion. Muevelos a un archivo (script con import) o revisa assetsInlineLimit.');
  process.exit(1);
}
console.log(`✔ CSP: ${paginas} paginas HTML sin scripts incrustados ni manejadores en linea.`);
