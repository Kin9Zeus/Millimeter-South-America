// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

/**
 * El dominio definitivo aun no esta decidido (GoDaddy). Railway inyecta SITE_URL
 * en produccion; el valor por defecto solo sirve para builds locales.
 * Ver 04-Web/Deploy en Railway y GoDaddy.md en el vault.
 */
const SITE = process.env.SITE_URL || 'https://millimetersouthamerica.com';

export default defineConfig({
  site: SITE,
  trailingSlash: 'never',

  // Todo se prerenderiza salvo las rutas que hagan `export const prerender = false`
  // (el endpoint de contacto). El adaptador Node se usa en modo middleware: el
  // servidor real es server.mjs, que anade las cabeceras de seguridad.
  output: 'static',
  adapter: node({ mode: 'middleware' }),

  i18n: {
    locales: ['es', 'en'],
    defaultLocale: 'es',
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: false,
    },
  },

  image: {
    // Formatos modernos primero; sharp hace el resto en build.
    responsiveStyles: true,
    layout: 'constrained',
  },

  build: {
    inlineStylesheets: 'auto',
    assets: '_assets',
  },

  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },

  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'es',
        locales: { es: 'es-CO', en: 'en-US' },
      },
      // Fuera del sitemap lo que no debe aparecer en resultados de busqueda:
      // paginas de servicio y legales. Coinciden con los Disallow de robots.txt.
      filter: (page) =>
        !page.includes('/gracias') &&
        !page.includes('/thank-you') &&
        !page.includes('/legal/') &&
        !page.includes('/404'),
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
    // Solo afecta al servidor de desarrollo. GSAP y Lenis se importan de forma
    // condicional (motion.ts no se carga con reduced-motion), asi que Vite no los ve
    // al arrancar; los optimiza en la primera visita y responde 504 "Outdated Optimize
    // Dep" a la importacion en curso: las animaciones no arrancan hasta recargar.
    optimizeDeps: {
      include: ['gsap', 'gsap/ScrollTrigger', 'lenis'],
    },
    build: {
      cssCodeSplit: true,
    },
  },
});
