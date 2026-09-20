/**
 * Servidor de produccion (Railway).
 *
 * Astro genera el sitio estatico + el handler de las rutas bajo demanda
 * (/api/contacto). Este servidor los sirve y, sobre todo, pone las cabeceras de
 * seguridad y el cacheo correcto — que es justo lo que el servidor standalone
 * de Astro no deja controlar.
 *
 *   npm run build && npm start
 *
 * Ver 04-Web/Seguridad de la web.md y 04-Web/Deploy en Railway y GoDaddy.md
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import compression from 'compression';
import helmet from 'helmet';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLIENT = path.join(__dirname, 'dist', 'client');
const PORT = Number(process.env.PORT) || 4321;
const HOST = process.env.HOST || '0.0.0.0';
const PROD = process.env.NODE_ENV !== 'development';

const { handler: ssrHandler } = await import('./dist/server/entry.mjs');

const app = express();

// Railway termina TLS en su proxy: sin esto, req.ip seria siempre la del proxy
// y la limitacion de tasa del formulario no distinguiria visitantes.
app.set('trust proxy', 1);
app.disable('x-powered-by');

/* -------------------------------------------------------------- seguridad */

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'none'"],
        // Todo el JS y el CSS son propios y con hash: ningun origen externo.
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // Astro inyecta estilos por componente
        imgSrc: ["'self'", 'data:', 'blob:'],
        mediaSrc: ["'self'"],
        fontSrc: ["'self'"], // tipografias autoalojadas
        connectSrc: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        baseUri: ["'none'"],
        objectSrc: ["'none'"],
        manifestSrc: ["'self'"],
        upgradeInsecureRequests: PROD ? [] : null,
      },
    },
    // La web no usa ningun recurso de terceros, asi que el aislamiento
    // de origen cruzado se puede poner estricto sin romper nada.
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-origin' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hsts: PROD ? { maxAge: 63072000, includeSubDomains: true, preload: true } : false,
    xFrameOptions: { action: 'deny' },
    noSniff: true,
    // X-XSS-Protection es contraproducente en navegadores modernos: helmet
    // lo desactiva por defecto y se deja asi.
  }),
);

// Cabeceras que helmet no cubre.
app.use((_req, res, next) => {
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), accelerometer=(), gyroscope=(), interest-cohort=()',
  );
  next();
});

app.use(compression());

/* ---------------------------------------------------------------- caches */

/**
 * Los assets con hash en el nombre son inmutables: se cachean un anio.
 * El HTML no: tiene que revalidarse para que un despliegue se vea al instante.
 */
app.use(
  '/_assets',
  express.static(path.join(CLIENT, '_assets'), {
    immutable: true,
    maxAge: '1y',
    fallthrough: true,
  }),
);

app.use(
  express.static(CLIENT, {
    // El HTML lo resuelve el bloque siguiente: express.static redirigiria
    // /tecnologia a /tecnologia/, y la configuracion canonica del sitio es
    // sin barra final (trailingSlash: 'never').
    index: false,
    redirect: false,
    maxAge: '7d',
    setHeaders(res, filePath) {
      if (/\.(woff2|avif|webp|jpg|jpeg|png|mp4|webm|svg)$/.test(filePath)) {
        res.setHeader('cache-control', 'public, max-age=2592000');
      }
    },
  }),
);

/* -------------------------------------------------------- HTML canonico */

/**
 * Una sola URL por pagina: `/tecnologia`, nunca `/tecnologia/`.
 * Dos URLs para el mismo contenido es contenido duplicado y reparte la
 * autoridad de enlaces entre ambas.
 */
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  if (req.path.length > 1 && req.path.endsWith('/')) {
    const query = req.originalUrl.slice(req.path.length);
    return res.redirect(301, req.path.replace(/\/+$/, '') + query);
  }
  next();
});

/** Sirve la pagina prerenderizada que corresponde a la ruta. */
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  if (path.extname(req.path)) return next();

  const rel = req.path === '/' ? 'index.html' : path.join(req.path.slice(1), 'index.html');
  const full = path.resolve(CLIENT, rel);

  // Defensa contra path traversal: el archivo tiene que quedar dentro de dist/client.
  if (!full.startsWith(CLIENT + path.sep) && full !== path.join(CLIENT, 'index.html')) {
    return next();
  }

  res.sendFile(full, { headers: { 'cache-control': 'public, max-age=0, must-revalidate' } }, (err) => {
    if (err) next();
  });
});

/* ------------------------------------------------------------------ astro */

app.use(ssrHandler);

/* ------------------------------------------------------- 404 personalizado */

app.use(async (req, res) => {
  res.status(404);
  res.setHeader('cache-control', 'public, max-age=0, must-revalidate');

  // Un 404 en ingles no debe contestar en espanol: se pierde al visitante.
  const english = req.path === '/en' || req.path.startsWith('/en/');
  const page = english ? path.join(CLIENT, 'en', '404', 'index.html') : path.join(CLIENT, '404.html');

  res.sendFile(page, (err) => {
    if (!err || res.headersSent) return;
    res.sendFile(path.join(CLIENT, '404.html'), (err2) => {
      if (err2 && !res.headersSent) res.type('text/plain').send('404');
    });
  });
});

/* ------------------------------------------------------- errores y cierre */

app.use((err, _req, res, _next) => {
  console.error('[servidor]', err);
  if (res.headersSent) return;
  res.status(500).type('text/plain').send('Error interno del servidor');
});

const server = app.listen(PORT, HOST, () => {
  console.log(`MILLIMETER escuchando en http://${HOST}:${PORT}`);
});

// Railway manda SIGTERM al redesplegar: se cierra limpio para no cortar
// una peticion a medias.
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    console.log(`${signal} recibido, cerrando…`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  });
}
