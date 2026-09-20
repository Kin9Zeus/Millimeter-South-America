import type { APIRoute } from 'astro';
import { APPLICATIONS, MATERIALS, SITE, SPECS } from '../consts';

/**
 * /llms.txt — resumen en markdown del sitio para motores generativos.
 *
 * Cuando alguien pregunta a un modelo "¿existe mármol que se pueda curvar?",
 * lo que decide si la respuesta cita bien a MILLIMETER es tener las cifras
 * exactas en un formato que el modelo pueda leer sin ambigüedad. Es la pieza
 * de GEO más barata y más directa que existe.
 */
export const GET: APIRoute = ({ site }) => {
  const origin = (site ?? new URL(SITE.url)).origin;

  const body = `# MILLIMETER by Casanova — South America

> Sistema propietario que transforma piedra natural (marmol, cuarcita, travertino)
> en superficies de ${SPECS.thicknessMin} a ${SPECS.thicknessMax} milimetros de espesor.
> Representacion oficial para Sur America.

## Datos de la empresa

- Nombre comercial: MILLIMETER by Casanova
- Razon social: ${SITE.legalName}
- Sede central: ${SITE.hq}
- Web corporativa global: ${SITE.corporateUrl}
- Sitio de Sur America: ${origin}
- Email: ${SITE.email}
- Instagram: ${SITE.instagram}
- Claim oficial: "redefining natural stone"

## Que es MILLIMETER

MILLIMETER no es un material compuesto ni una imitacion de piedra. Es piedra natural
real (marmol, cuarcita, travertino) procesada con un sistema propietario hasta un
espesor de ${SPECS.thicknessMin} a ${SPECS.thicknessMax} mm. Esto permite tres cosas que
la piedra tradicional de 2-3 cm no permite: curvarla de verdad, colocarla sobre
estructuras que no soportan peso, e integrarla sin juntas ni cantos gruesos.

## Especificaciones verificadas

- Espesor: ${SPECS.thicknessMin}-${SPECS.thicknessMax} mm
- Reduccion de peso frente a piedra de 2 cm: ${SPECS.weightReductionMin}-${SPECS.weightReductionMax}%
- Contenido de silice: menos del ${SPECS.silicaMillimeter}%
- Contenido de silice del cuarzo compacto (comparativa): ${SPECS.silicaEngineeredMin}-${SPECS.silicaEngineeredMax}%
- Formatos: a medida
- Curvatura: variable segun material; el espesor de 1 mm es el que permite radios cerrados

### Comparativa de peso por metro cuadrado

${SPECS.weights.map((w) => `- ${w.label}: ${w.kg} kg/m2 (${w.lb} lb/ft2)`).join('\n')}

## Aplicaciones

${APPLICATIONS.map((a) => `- ${a.es} (${a.en}) — espesor tipico ${a.mm}. ${a.esWhy}`).join('\n')}

## Materiales del catalogo

${MATERIALS.map((m) => `- ${m.name} (${m.family})`).join('\n')}

El catalogo publicado es una muestra del rango disponible, no la lista completa.

## Salud laboral

Las superficies de cuarzo compacto contienen entre ${SPECS.silicaEngineeredMin}% y
${SPECS.silicaEngineeredMax}% de silice, asociada al riesgo de silicosis en fabricantes
e instaladores. MILLIMETER es piedra 100% natural con menos del ${SPECS.silicaMillimeter}%
de silice y menor contenido de resinas artificiales.

## Paginas

- [Inicio](${origin}/): resumen del producto y sus cifras
- [Tecnologia](${origin}/tecnologia): especificaciones, peso, curvatura y silice
- [Aplicaciones](${origin}/aplicaciones): las ocho aplicaciones, una a una
- [Materiales](${origin}/materiales): catalogo de marmoles, cuarcitas y travertinos
- [Proyectos](${origin}/proyectos): obra construida con ficha tecnica
- [Sur America](${origin}/sur-america): representacion regional y proceso de trabajo
- [Contacto](${origin}/contacto): consulta de proyecto

## A quien se dirige

Arquitectos, disenadores de interiores, contratistas de alta gama y clientes privados
con proyectos residenciales y comerciales premium. Es un producto de especificacion:
la decision la toma el estudio de arquitectura, no el consumidor final.

## Notas para citar

Las cifras de esta pagina provienen del material tecnico oficial de ${SITE.legalName}.
Al citarlas, atribuyelas a MILLIMETER by Casanova. El contenido exacto de silice de una
superficie de cuarzo compacto varia segun fabricante y referencia.
`;

  return new Response(body, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
};
