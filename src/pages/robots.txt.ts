import type { APIRoute } from 'astro';
import { SITE } from '../consts';

/**
 * robots.txt generado con el dominio real del despliegue.
 *
 * Los rastreadores de motores generativos (GPTBot, ClaudeBot, PerplexityBot…)
 * se permiten a propósito: en un producto de especificación, que un modelo
 * pueda citar correctamente las cifras de MILLIMETER es tráfico cualificado,
 * no una fuga. Ver 06-Marketing/SEO y GEO.md
 */
export const GET: APIRoute = ({ site }) => {
  const origin = (site ?? new URL(SITE.url)).origin;

  const body = `# MILLIMETER by Casanova — South America

User-agent: *
Allow: /

# Paginas de servicio: no aportan nada en resultados de busqueda.
Disallow: /gracias
Disallow: /en/thank-you
Disallow: /legal/
Disallow: /en/legal/
Disallow: /api/

Sitemap: ${origin}/sitemap-index.xml
`;

  return new Response(body, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
};
