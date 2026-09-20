/**
 * Constantes del sitio. Datos de negocio verificados contra
 * 02-Empresa/ en el vault. No inventar cifras aquí.
 */

export const SITE = {
  name: 'MILLIMETER by Casanova',
  region: 'South America',
  /** Se sobrescribe con SITE_URL en Railway. */
  url: import.meta.env.SITE ?? 'https://millimetersouthamerica.com',
  /** Email corporativo oficial (brochure v2). */
  email: 'info@millimeterbycasanova.com',
  corporateUrl: 'https://www.millimeterbycasanova.com',
  instagram: 'https://www.instagram.com/casanova_southamerica',
  legalName: 'MILLIMETER Global LLC.',
  hq: 'Houston, Texas, USA',
  /**
   * Responsable del tratamiento de datos, para las páginas legales.
   * No hay entidad constituida en Sur América, así que el responsable es la
   * entidad que realmente existe y cuyo buzón recibe las consultas.
   * Ver 07-Decisiones/ADR-0006.
   */
  controller: {
    name: 'MILLIMETER Global LLC.',
    city: 'Houston',
    state: 'Texas',
    country: 'Estados Unidos',
    countryEn: 'United States',
    /** TODO-CLIENTE: dirección postal completa. Mejora la política, no la bloquea. */
    street: null as string | null,
  },
  /** TODO-CLIENTE: confirmar con Oscar antes de publicar. */
  phone: null as string | null,
  whatsapp: null as string | null,
  city: null as string | null,
} as const;

/** Cifras oficiales del brochure v2. Ver 02-Empresa/Especificaciones técnicas de Millimeter.md */
export const SPECS = {
  thicknessMin: 1,
  thicknessMax: 5,
  weightReductionMin: 80,
  weightReductionMax: 90,
  silicaMillimeter: 0.5,
  silicaEngineeredMin: 40,
  silicaEngineeredMax: 80,
  weights: [
    { label: 'Piedra tradicional 2 cm', labelEn: 'Traditional stone 2 cm', kg: '63–73', lb: '13–15', scale: 1 },
    { label: 'MILLIMETER 5 mm', labelEn: 'MILLIMETER 5 mm', kg: '15–20', lb: '3–4', scale: 0.26 },
    { label: 'MILLIMETER 1 mm', labelEn: 'MILLIMETER 1 mm', kg: '< 5', lb: '< 1', scale: 0.07 },
  ],
} as const;

export const LOCALES = ['es', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'es';

/** Mapa de rutas equivalentes entre idiomas, para el selector y los hreflang. */
export const ROUTES: Record<string, { es: string; en: string }> = {
  home: { es: '/', en: '/en' },
  tecnologia: { es: '/tecnologia', en: '/en/technology' },
  aplicaciones: { es: '/aplicaciones', en: '/en/applications' },
  materiales: { es: '/materiales', en: '/en/materials' },
  proyectos: { es: '/proyectos', en: '/en/projects' },
  surAmerica: { es: '/sur-america', en: '/en/south-america' },
  contacto: { es: '/contacto', en: '/en/contact' },
  privacidad: { es: '/legal/privacidad', en: '/en/legal/privacy' },
  cookies: { es: '/legal/cookies', en: '/en/legal/cookies' },
};

export const NAV = [
  { key: 'tecnologia', es: 'Tecnología', en: 'Technology' },
  { key: 'aplicaciones', es: 'Aplicaciones', en: 'Applications' },
  { key: 'materiales', es: 'Materiales', en: 'Materials' },
  { key: 'proyectos', es: 'Proyectos', en: 'Projects' },
  { key: 'surAmerica', es: 'Sur América', en: 'South America' },
] as const;

/** Los 12 materiales de la galería oficial. Ver 02-Empresa/Catálogo de materiales.md */
export const MATERIALS = [
  { slug: 'bianco-carrara', name: 'Bianco Carrara', family: 'marmol', tone: 'claro', hex: '#c9cacb' },
  { slug: 'calacatta-venatina', name: 'Calacatta Venatina', family: 'marmol', tone: 'claro', hex: '#efefec' },
  { slug: 'nero-marquina', name: 'Nero Marquina', family: 'marmol', tone: 'oscuro', hex: '#121316' },
  { slug: 'dark-emperador', name: 'Dark Emperador', family: 'marmol', tone: 'oscuro', hex: '#4a3226' },
  { slug: 'cream-travertine', name: 'Cream Travertine', family: 'travertino', tone: 'claro', hex: '#ded2ba' },
  { slug: 'pietra-grey', name: 'Pietra Grey', family: 'marmol', tone: 'oscuro', hex: '#3d3a3b' },
  { slug: 'sahara-noir', name: 'Sahara Noir', family: 'marmol', tone: 'oscuro', hex: '#2a1d14' },
  { slug: 'verdi-alpi', name: 'Verdi Alpi', family: 'marmol', tone: 'color', hex: '#17423c' },
  { slug: 'dark-rosa-portugues', name: 'Dark Rosa Portugues', family: 'marmol', tone: 'color', hex: '#8d7d86' },
  { slug: 'rojo-levante', name: 'Rojo Levante', family: 'marmol', tone: 'color', hex: '#5a1d21' },
  { slug: 'nidali', name: 'Nidali', family: 'cuarcita', tone: 'color', hex: '#96907a' },
  { slug: 'cappuccino', name: 'Cappuccino', family: 'marmol', tone: 'claro', hex: '#b5a795' },
] as const;

/** Las 8 aplicaciones oficiales. Ver 02-Empresa/Aplicaciones de Millimeter.md */
export const APPLICATIONS = [
  { slug: 'muros', es: 'Muros decorativos', en: 'Feature walls', mm: '1 mm', esWhy: 'Paños enormes sin juntas ni anclajes pesados.', enWhy: 'Vast uninterrupted planes, no heavy anchoring.' },
  { slug: 'chimeneas', es: 'Chimeneas', en: 'Fireplaces', mm: '3 mm', esWhy: 'Piedra fina sobre la estructura que ya existe.', enWhy: 'Thin stone over the structure already there.' },
  { slug: 'arquitectonicos', es: 'Elementos arquitectónicos', en: 'Architectural elements', mm: '1 mm', esWhy: 'Arcos y columnas revestidos en curva continua.', enWhy: 'Arches and columns clad in one continuous curve.' },
  { slug: 'duchas', es: 'Grandes duchas', en: 'Walking showers', mm: '5 mm', esWhy: 'Menos juntas: menos filtración y menos silicona.', enWhy: 'Fewer joints: less seepage, less silicone.' },
  { slug: 'mobiliario', es: 'Mobiliario a medida', en: 'Custom furniture', mm: '1 mm', esWhy: 'Frentes de piedra que abren y cierran de verdad.', enWhy: 'Stone fronts that actually open and close.' },
  { slug: 'puertas', es: 'Puertas y paneles', en: 'Doors & panels', mm: '5 mm', esWhy: 'Peso compatible con herrajes estándar.', enWhy: 'Weight compatible with standard hardware.' },
  { slug: 'curvas', es: 'Superficies curvas', en: 'Curved surfaces', mm: '1 mm', esWhy: 'Curva real, no despiece que la simula.', enWhy: 'A real curve, not a cut that fakes one.' },
  { slug: 'techos', es: 'Techos', en: 'Ceilings', mm: '1 mm', esWhy: 'Solo viable porque pesa menos de 5 kg/m².', enWhy: 'Only viable because it weighs under 5 kg/m².' },
] as const;

/** Proyectos documentados en el brochure v2. */
export const PROJECTS = [
  {
    slug: 'wittman-residence',
    title: 'Wittman Residence',
    piece: { es: 'Vanity flotante curvo', en: 'Curved floating vanity' },
    location: 'Austin, TX · USA',
    material: 'Cream Travertine',
    thickness: '1 mm + 5 mm',
    finish: { es: 'Honed o mate', en: 'Honed or matte' },
    details: {
      es: ['Puerta curva · 1 mm', 'Lavabo integrado · 5 mm', 'Cantos · 1 mm', 'Cajones · 1 mm'],
      en: ['Curved door · 1 mm', 'Integrated sink · 5 mm', 'Trim · 1 mm', 'Drawers · 1 mm'],
    },
  },
  {
    slug: 'arco-san-diego',
    title: { es: 'Arco de mármol', en: 'Marble arch' },
    piece: { es: 'Revestimiento en curva continua', en: 'Continuous curved cladding' },
    location: 'San Diego, CA · USA',
    material: 'Calacatta Viola',
    thickness: '1 mm + 2 cm',
    finish: { es: 'Pulido', en: 'Polished' },
    details: { es: [], en: [] },
  },
  {
    slug: 'mueble-houston',
    title: { es: 'Detalle de mueble', en: 'Cabinet detail' },
    piece: { es: 'Frente en Dark Emperador', en: 'Dark Emperador front' },
    location: 'Houston, TX · USA',
    material: 'Dark Emperador',
    thickness: '5 mm',
    finish: { es: 'Pulido', en: 'Polished' },
    details: { es: [], en: [] },
  },
] as const;
