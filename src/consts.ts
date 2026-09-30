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
    countryFr: 'États-Unis',
    /** TODO-CLIENTE: dirección postal completa. Mejora la política, no la bloquea. */
    street: null as string | null,
  },
  /** TODO-CLIENTE: confirmar con Oscar antes de publicar. */
  phone: null as string | null,
  /** WhatsApp de Oscar Velásquez (E.164). Facilitado por el cliente el 2026-09-29; alimenta el botón flotante. */
  whatsapp: '+17758309956',
  city: null as string | null,
} as const;

/** Cifras oficiales del brochure v2. Ver 02-Empresa/Especificaciones técnicas de Millimeter.md */
export const SPECS = {
  thicknessMin: 1,
  thicknessMax: 5,
  weightReductionMin: 80,
  weightReductionMax: 90,
  silicaMillimeter: 0.5,
  // Cuarzo de ingenieria: 10-40 %. Cifra corregida por el cliente el 2026-09-29 (los fabricantes
  // lo redujeron de forma significativa, aunque sigue siendo insuficiente). El brochure v2 trae 40-80 %.
  silicaEngineeredMin: 10,
  silicaEngineeredMax: 40,
  weights: [
    { label: 'Piedra tradicional 2 cm', labelEn: 'Traditional stone 2 cm', labelFr: 'Pierre traditionnelle 2 cm', kg: '63–73', lb: '13–15', scale: 1 },
    { label: 'MILLIMETER 5 mm', labelEn: 'MILLIMETER 5 mm', labelFr: 'MILLIMETER 5 mm', kg: '15–20', lb: '3–4', scale: 0.26 },
    { label: 'MILLIMETER 1 mm', labelEn: 'MILLIMETER 1 mm', labelFr: 'MILLIMETER 1 mm', kg: '< 5', lb: '< 1', scale: 0.07 },
  ],
} as const;

export const LOCALES = ['es', 'en', 'fr'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'es';

/** Mapa de rutas equivalentes entre idiomas, para el selector y los hreflang. */
export const ROUTES: Record<string, Record<Locale, string>> = {
  home: { es: '/', en: '/en', fr: '/fr' },
  tecnologia: { es: '/tecnologia', en: '/en/technology', fr: '/fr/technologie' },
  aplicaciones: { es: '/aplicaciones', en: '/en/applications', fr: '/fr/applications' },
  materiales: { es: '/materiales', en: '/en/materials', fr: '/fr/materiaux' },
  proyectos: { es: '/proyectos', en: '/en/projects', fr: '/fr/projets' },
  surAmerica: { es: '/sur-america', en: '/en/south-america', fr: '/fr/amerique-du-sud' },
  empleo: { es: '/empleo', en: '/en/careers', fr: '/fr/emploi' },
  contacto: { es: '/contacto', en: '/en/contact', fr: '/fr/contact' },
  privacidad: { es: '/legal/privacidad', en: '/en/legal/privacy', fr: '/fr/legal/confidentialite' },
  cookies: { es: '/legal/cookies', en: '/en/legal/cookies', fr: '/fr/legal/cookies' },
};

export const NAV = [
  { key: 'home', es: 'Inicio', en: 'Home', fr: 'Accueil' },
  { key: 'tecnologia', es: 'Tecnología', en: 'Technology', fr: 'Technologie' },
  { key: 'aplicaciones', es: 'Aplicaciones', en: 'Applications', fr: 'Applications' },
  { key: 'materiales', es: 'Materiales', en: 'Materials', fr: 'Matériaux' },
  { key: 'proyectos', es: 'Proyectos', en: 'Projects', fr: 'Projets' },
  { key: 'surAmerica', es: 'Sur América', en: 'South America', fr: 'Amérique du Sud' },
  { key: 'empleo', es: 'Empleo', en: 'Careers', fr: 'Emploi' },
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
  { slug: 'muros', es: 'Muros decorativos', en: 'Feature walls', mm: '5 mm', mmEs: '5 mm', esWhy: 'Paños de gran formato con pocas juntas y sin anclajes pesados.', enWhy: 'Large-format planes with few joints and no heavy anchoring.', fr: 'Murs décoratifs', mmFr: '5 mm', frWhy: 'Grands formats avec peu de joints, sans ancrages lourds.' },
  { slug: 'chimeneas', es: 'Chimeneas', en: 'Fireplaces', mm: '1 & 5 mm', mmEs: '1 y 5 mm', esWhy: 'Piedra fina sobre la estructura que ya existe.', enWhy: 'Thin stone over the structure already there.', fr: 'Cheminées', mmFr: '1 et 5 mm', frWhy: 'Une pierre fine sur la structure existante.' },
  { slug: 'arquitectonicos', es: 'Elementos arquitectónicos', en: 'Architectural elements', mm: '1 mm', mmEs: '1 mm', esWhy: 'Arcos y columnas revestidos en curva continua.', enWhy: 'Arches and columns clad in one continuous curve.', fr: 'Éléments architecturaux', mmFr: '1 mm', frWhy: 'Arcs et colonnes habillés d’une courbe continue.' },
  { slug: 'duchas', es: 'Grandes duchas', en: 'Walking showers', mm: '5 mm', mmEs: '5 mm', esWhy: 'Menos juntas: menos filtración y menos silicona.', enWhy: 'Fewer joints: less seepage, less silicone.', fr: 'Grandes douches', mmFr: '5 mm', frWhy: 'Moins de joints : moins d’infiltrations, moins de silicone.' },
  { slug: 'mobiliario', es: 'Mobiliario a medida', en: 'Custom furniture', mm: '1 & 5 mm', mmEs: '1 y 5 mm', esWhy: 'Frentes de piedra que abren y cierran de verdad.', enWhy: 'Stone fronts that actually open and close.', fr: 'Mobilier sur mesure', mmFr: '1 et 5 mm', frWhy: 'Des façades en pierre qui s’ouvrent et se ferment vraiment.' },
  { slug: 'puertas', es: 'Puertas y paneles', en: 'Doors & panels', mm: '5 mm', mmEs: '5 mm', esWhy: 'Peso compatible con herrajes estándar.', enWhy: 'Weight compatible with standard hardware.', fr: 'Portes et panneaux', mmFr: '5 mm', frWhy: 'Un poids compatible avec la quincaillerie standard.' },
  { slug: 'curvas', es: 'Superficies curvas', en: 'Curved surfaces', mm: '1 mm', mmEs: '1 mm', esWhy: 'Curva real, no despiece que la simula.', enWhy: 'A real curve, not a cut that fakes one.', fr: 'Surfaces courbes', mmFr: '1 mm', frWhy: 'Une vraie courbe, pas une découpe qui la simule.' },
  { slug: 'techos', es: 'Techos', en: 'Ceilings', mm: '5 mm', mmEs: '5 mm', esWhy: 'Solo viable porque pesa 15–20 kg/m², no 63–73.', enWhy: 'Only viable because it weighs 15–20 kg/m², not 63–73.', fr: 'Plafonds', mmFr: '5 mm', frWhy: 'Possible uniquement parce qu’il pèse 15–20 kg/m², et non 63–73.' },
] as const;

/**
 * Huella de carbono: por que un espesor de 1 a 5 mm reduce el impacto ambiental.
 * Enunciado del cliente (2026-09-29), sin cifras de emisiones: no se publica ningun numero que
 * no este medido. Cuando exista una medicion verificada, se anade aqui (TODO-CLIENTE).
 */
export const HUELLA = [
  {
    key: 'transporte',
    es: { k: 'Transporte', v: 'Cada metro cuadrado pesa hasta un 90 % menos: menos peso por envío y menos energía para moverlo.' },
    en: { k: 'Transport', v: 'Each square metre weighs up to 90% less: less weight per shipment and less energy to move it.' },
    fr: { k: 'Transport', v: 'Chaque mètre carré pèse jusqu’à 90 % de moins : moins de poids par expédition et moins d’énergie pour le déplacer.' },
  },
  {
    key: 'embalaje',
    es: { k: 'Embalaje', v: 'Piezas más finas y ligeras necesitan menos material de embalaje y ocupan menos volumen de carga.' },
    en: { k: 'Packaging', v: 'Thinner, lighter pieces need less packaging material and take up less freight volume.' },
    fr: { k: 'Emballage', v: 'Des pièces plus fines et plus légères demandent moins de matériau d’emballage et occupent moins de volume de chargement.' },
  },
  {
    key: 'mecanicos',
    es: { k: 'Medios mecánicos', v: 'Menos peso exige menos maquinaria de elevación y anclajes más ligeros, en taller y en obra.' },
    en: { k: 'Mechanical handling', v: 'Less weight calls for lighter lifting equipment and lighter anchoring, in the workshop and on site.' },
    fr: { k: 'Moyens mécaniques', v: 'Moins de poids exige des engins de levage plus légers et des fixations allégées, en atelier comme sur chantier.' },
  },
  {
    key: 'material',
    es: { k: 'Material por metro cuadrado', v: 'Un milímetro de piedra cubre lo que antes pedía dos centímetros: la misma piedra natural, con una fracción del material.' },
    en: { k: 'Material per square metre', v: 'A millimetre of stone covers what used to take two centimetres: the same natural stone, with a fraction of the material.' },
    fr: { k: 'Matériau par mètre carré', v: 'Un millimètre de pierre couvre ce qui demandait deux centimètres : la même pierre naturelle, avec une fraction de la matière.' },
  },
  {
    key: 'instalacion',
    es: { k: 'Instalación', v: 'Más rápida y segura, con menos roturas en obra.' },
    en: { k: 'Installation', v: 'Faster and safer, with fewer breakages on site.' },
    fr: { k: 'Installation', v: 'Plus rapide et plus sûre, avec moins de casse sur chantier.' },
  },
] as const;

/** Proyectos documentados en el brochure v2. */
export const PROJECTS = [
  {
    slug: 'wittman-residence',
    title: 'Wittman Residence',
    piece: { es: 'Vanity flotante curvo', en: 'Curved floating vanity', fr: 'Meuble vasque flottant courbe' },
    location: 'Austin, TX · USA',
    material: 'Cream Travertine',
    thickness: '1 mm + 5 mm',
    finish: { es: 'Honed o mate', en: 'Honed or matte', fr: 'Honed ou mat' },
    details: {
      es: ['Puerta curva · 1 mm', 'Lavabo integrado · 5 mm', 'Cantos · 1 mm', 'Cajones · 1 mm'],
      en: ['Curved door · 1 mm', 'Integrated sink · 5 mm', 'Trim · 1 mm', 'Drawers · 1 mm'],
      fr: ['Porte courbe · 1 mm', 'Vasque intégrée · 5 mm', 'Chants · 1 mm', 'Tiroirs · 1 mm'],
    },
  },
  {
    slug: 'arco-san-diego',
    title: { es: 'Arco de mármol', en: 'Marble arch', fr: 'Arche en marbre' },
    piece: { es: 'Revestimiento en curva continua', en: 'Continuous curved cladding', fr: 'Revêtement en courbe continue' },
    location: 'San Diego, CA · USA',
    material: 'Calacatta Viola',
    thickness: '1 mm + 2 cm',
    finish: { es: 'Pulido', en: 'Polished', fr: 'Poli' },
    details: { es: [], en: [], fr: [] },
  },
  {
    slug: 'altuve-residence',
    title: 'Altuve Residence',
    piece: { es: 'Mueble empotrado en Dark Emperador', en: 'Built-in cabinet in Dark Emperador', fr: 'Meuble encastré en Dark Emperador' },
    location: 'Houston, TX · USA',
    material: 'Dark Emperador',
    thickness: '5 mm',
    finish: { es: 'Honed o mate', en: 'Honed or matte', fr: 'Honed ou mat' },
    details: {
      es: ['Puertas · 5 mm', 'Frame · 5 mm', 'Toe kick · 5 mm', 'Repisas · 5 mm', 'Cajas · madera Mahogany oscuro'],
      en: ['Doors · 5 mm', 'Frame · 5 mm', 'Toe kick · 5 mm', 'Shelves · 5 mm', 'Boxes · dark Mahogany wood'],
      fr: ['Portes · 5 mm', 'Cadre · 5 mm', 'Plinthe · 5 mm', 'Étagères · 5 mm', 'Caissons · bois d’acajou foncé'],
    },
  },
] as const;
