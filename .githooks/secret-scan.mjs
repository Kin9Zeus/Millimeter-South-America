#!/usr/bin/env node
/**
 * Guardián de secretos: bloquea el commit si lo que se va a subir parece contener una clave.
 *
 * Por qué existe: en Git, lo que entra en un commit queda en el historial para siempre.
 * Borrar el archivo después NO lo quita del historial; la única defensa real es rotar la
 * clave. Es mucho más barato que el commit no llegue a existir.
 *
 * Revisa el contenido que está en el índice (lo que de verdad se va a commitear), no el del
 * disco. Se activa una vez por clon con:
 *
 *   git config core.hooksPath .githooks
 *
 * Saltarlo en un caso legítimo (falso positivo): `git commit --no-verify`, o poner
 * `secret-scan:ignore` en la misma línea.
 */
import { execFileSync } from 'node:child_process';

const git = (...args) => execFileSync('git', args, { encoding: 'buffer', maxBuffer: 256 * 1024 * 1024 });

const PATRONES = {
  'Clave de Google / Gemini (AIza…)': /AIza[0-9A-Za-z_-]{35}/g,
  'Clave de Google / Gemini (AQ.…)': /\bAQ\.[A-Za-z0-9_-]{20,}/g,
  'Clave de Resend (re_…)': /\bre_[A-Za-z0-9]{6,}_[A-Za-z0-9]{16,}\b/g,
  'Clave tipo OpenAI / Anthropic (sk-…)': /\bsk-[A-Za-z0-9_-]{20,}/g,
  'Token de GitHub': /\b(gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})/g,
  'Token de Slack': /\bxox[baprs]-[A-Za-z0-9-]{10,}/g,
  'Clave de acceso de AWS': /\bAKIA[0-9A-Z]{16}\b/g,
  'Clave privada (PEM)': /-----BEGIN [A-Z ]*PRIVATE KEY-----/g,
  'JWT': /\beyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}/g,
  'Cabecera Bearer con valor': /Bearer\s+[A-Za-z0-9._~+/=-]{24,}/g,
  'Secreto asignado como literal': /\b(api[_-]?key|secret|passw(or)?d|token|auth)[A-Za-z_]*\s*[:=]\s*['"][A-Za-z0-9_\-./+=]{16,}['"]/gi,
  'URL con usuario y contraseña': /\b[a-z]+:\/\/[^\s/:@]+:[^\s/@]{4,}@[^\s]+/g,
};

/** Archivos que no deben subirse nunca, con independencia de su contenido. */
const NOMBRES_PROHIBIDOS = [
  /(^|\/)\.env(\.|$)/, // .env, .env.local, .env.example… ningún archivo de entorno entra
  /(^|\/)\.envrc$/,
  /\.env$/i, // staging.env, config.env…
  /\.(pem|key|p12|pfx)$/i,
  /(^|\/)id_(rsa|ed25519)/,
  /(^|\/)settings\.local\.json$/,
  /(^|\/)\.claude\/state\//,
];

const mask = (s) => (s.length <= 10 ? '***' : `${s.slice(0, 6)}…${s.slice(-2)} (${s.length} car.)`);

const staged = git('diff', '--cached', '--name-only', '--diff-filter=ACM', '-z')
  .toString('utf8')
  .split('\0')
  .filter(Boolean);

const problemas = [];
for (const archivo of staged) {
  if (NOMBRES_PROHIBIDOS.some((re) => re.test(archivo))) {
    problemas.push(`  ${archivo}  →  archivo que nunca debe subirse (por su nombre)`);
    continue;
  }
  let contenido;
  try {
    contenido = git('show', `:${archivo}`);
  } catch {
    continue;
  }
  if (contenido.subarray(0, 8000).includes(0)) continue; // binario: no se puede leer como texto
  const lineas = contenido.toString('utf8').split('\n');
  lineas.forEach((linea, i) => {
    if (linea.includes('secret-scan:ignore')) return;
    for (const [nombre, re] of Object.entries(PATRONES)) {
      re.lastIndex = 0;
      for (const m of linea.matchAll(re)) problemas.push(`  ${archivo}:${i + 1}  →  ${nombre}  ${mask(m[0])}`);
    }
  });
}

if (problemas.length) {
  console.error('\n✖ Commit BLOQUEADO: parece que hay secretos en lo que vas a subir.\n');
  console.error(problemas.join('\n'));
  console.error(
    '\nQuita el secreto del archivo (las claves van en las variables de Railway, nunca en el repositorio).' +
      '\nSi ya lo habías pegado y guardado en algún sitio, rota esa clave: borrarla del código no la protege.' +
      '\nSi es un falso positivo: añade `secret-scan:ignore` en esa línea o usa `git commit --no-verify`.\n',
  );
  process.exit(1);
}
console.log(`✔ Guardián de secretos: ${staged.length} archivo(s) revisados, sin secretos.`);
