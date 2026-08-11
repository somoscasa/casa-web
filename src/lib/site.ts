export const SITE = {
  name: "CASA",
  tagline: "Sentite en casa.",
  city: "Villa Crespo, Buenos Aires",
  email: process.env.NEXT_PUBLIC_EMAIL ?? "somoscasa.ar@gmail.com",
  whatsapp:
    process.env.NEXT_PUBLIC_WHATSAPP_URL ??
    "https://wa.me/5491139295625?text=Hola%20CASA%2C%20quiero%20consultar%20mi%20presupuesto.",
  whatsappRaw: "+54 9 11 3929-5625",
  instagram:
    process.env.NEXT_PUBLIC_INSTAGRAM_URL ??
    "https://www.instagram.com/somos.casa.ok/",
  instagramHandle: "@somos.casa.ok",
} as const;

export const NAV = [
  { href: "/portfolio", label: "PORTFOLIO" },
  { href: "/servicios", label: "SERVICIOS" },
  { href: "/bodas", label: "BODAS" },
  { href: "/nosotros", label: "ABOUT" },
  { href: "/contacto", label: "CONTACTO" },
] as const;

type Pkg = {
  id: string;
  name: string;
  blurb: string;
  highlight?: boolean;
  badge?: string;
  features: string[];
  homeFeatures?: string[];
};

export const PACKAGES: Pkg[] = [
  {
    id: "esencial",
    name: "ESENCIAL",
    blurb:
      "La cobertura justa, sin excesos. Para quienes quieren lo importante, bien hecho.",
    features: [
      "1 Filmmaker · 1 Fotógrafo",
      "Cobertura ceremonia → cierre",
      "Galería digital privada",
      "Selección de fotos editadas",
      "Video resumen · 3 min",
    ],
  },
  {
    id: "clasico",
    name: "CLÁSICO",
    blurb:
      "Nuestro punto de equilibrio. La historia completa del día, de principio a fin.",
    highlight: true,
    badge: "MÁS ELEGIDO",
    features: [
      "2 Filmmakers · 2 Fotógrafos",
      "Civil + Getting Ready + Boda Completa",
      "Galería digital privada + descarga",
      "Selección ampliada de fotos editadas",
      "Video largo · 8 min + teaser",
    ],
    homeFeatures: [
      "2 Filmmakers · 2 Fotógrafos",
      "Civil + Getting Ready + Boda Completa",
      "Galería digital privada + descarga",
      "Selección ampliada de fotos editadas",
    ],
  },
  {
    id: "premium",
    name: "PREMIUM",
    blurb:
      "La experiencia completa. Cada momento registrado, cada detalle cuidado.",
    features: [
      "2 Filmmakers · 2 Fotógrafos",
      "Cobertura integral · todo el evento",
      "Drone + edición en vivo",
      "Galería completa de fotos editadas",
      "Película documental · 15 min",
      "Álbum fine-art impreso",
    ],
    homeFeatures: [
      "2 Filmmakers · 2 Fotógrafos",
      "Cobertura integral · todo el evento",
      "Drone + edición en vivo",
      "La experiencia completa",
    ],
  },
];

function u(id: string, w: number, h: number) {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;
}

export const IMG = {
  heroBodas: u("1519741497674-611481863552", 1400, 900),
};

type GalleryPhoto = { src: string; alt: string; ratio: "tall" | "wide" | "sq" };

export const GALLERY: GalleryPhoto[] = [
  { src: u("1519741497674-611481863552", 800, 1180), alt: "Boda · Palermo · Catalina y Tomás", ratio: "tall" },
  { src: u("1606216794074-735e91aa2c92", 900, 900), alt: "Detalle · anillos", ratio: "sq" },
  { src: u("1465495976277-4387d4b0b4c6", 1200, 800), alt: "Getting ready", ratio: "wide" },
  { src: u("1511285560929-80b456fea0bc", 800, 1180), alt: "Civil · Villa Crespo", ratio: "tall" },
  { src: u("1530103862676-de8c9debad1d", 900, 900), alt: "El brindis", ratio: "sq" },
  { src: u("1537633552985-df8429e8048b", 800, 1180), alt: "Última hora · fiesta", ratio: "tall" },
];

type PortfolioItem = {
  id: string;
  title: string;
  sub: string;
  src: string;
};

export const PORTFOLIO: PortfolioItem[] = [
  { id: "p01", title: "Catalina & Tomás", sub: "Boda · Palermo", src: u("1519741497674-611481863552", 900, 1240) },
  { id: "p02", title: "El sí", sub: "Detalle · Anillos", src: u("1606216794074-735e91aa2c92", 900, 900) },
  { id: "p03", title: "Primera luz", sub: "Getting ready", src: u("1465495976277-4387d4b0b4c6", 1200, 800) },
  { id: "p04", title: "Civil", sub: "Villa Crespo", src: u("1511285560929-80b456fea0bc", 900, 1240) },
  { id: "p05", title: "El brindis", sub: "Recepción", src: u("1530103862676-de8c9debad1d", 900, 900) },
  { id: "p06", title: "Última hora", sub: "Fiesta · Boda", src: u("1537633552985-df8429e8048b", 900, 1240) },
  { id: "p07", title: "Lucía & Mateo", sub: "Boda · Tigre", src: u("1525258946800-98cfd641d0de", 1200, 800) },
  { id: "p08", title: "El abrazo", sub: "Ceremonia", src: u("1460978812857-470ed1c77af0", 900, 1240) },
  { id: "p09", title: "Detalle", sub: "Velas y mesa", src: u("1522673607200-164d1b6ce486", 900, 900) },
  { id: "p10", title: "Hora dorada", sub: "Retrato pareja", src: u("1469371670807-013ccf25f16a", 900, 1240) },
  { id: "p11", title: "Después", sub: "Cierre · Madrugada", src: u("1453394221061-0e26a4e4406b", 1200, 800) },
  { id: "p12", title: "Sofía & Bruno", sub: "Boda · San Isidro", src: u("1591604466107-ec97de577aff", 900, 1240) },
];

export const TESTIMONIALS = [
  {
    quote:
      "No sentimos que había un fotógrafo. Sentimos que había alguien más disfrutando con nosotros.",
    attr: "Catalina y Tomás · Boda 2024",
  },
  {
    quote:
      "El video nos hizo llorar de nuevo, meses después.",
    attr: "Sol & Fede · Boda 2024",
  },
];

export const FAQ_BODAS = [
  {
    q: "¿Cuánto tiempo antes hay que reservar?",
    a: "Lo ideal es entre 8 y 12 meses antes de la fecha. Los sábados de temporada se cierran rápido. Si tu fecha es más cercana, escribinos igual: a veces hay lugar.",
  },
  {
    q: "¿Cómo se reserva una fecha?",
    a: "Charlamos por WhatsApp o por mail, definimos el paquete y enviamos un contrato y una seña del 40%. Con eso queda bloqueada.",
  },
  {
    q: "¿En cuánto tiempo entregan el material?",
    a: "Una preview con 30–50 fotos llega dentro de los 15 días. La galería completa y el video se entregan entre 45 y 90 días, según el paquete.",
  },
  {
    q: "¿Hacen bodas fuera de Buenos Aires?",
    a: "Sí. Trabajamos por todo el país. Para destinos lejanos sumamos viáticos según corresponda.",
  },
  {
    q: "¿Puedo elegir el estilo de edición?",
    a: "Nuestro estilo es editorial, cálido y honesto. Podés contarnos tus referencias y lo ajustamos, pero no hacemos preset extremos ni filtros pesados.",
  },
  {
    q: "¿Imprimen álbumes?",
    a: "Sí. El paquete Premium ya incluye uno. En los otros paquetes lo sumás como adicional. Hacemos álbumes fine-art impresos en papeles seleccionados.",
  },
];

export const PILARES = [
  {
    n: "01",
    title: "Calidez antes que prestigio.",
    body:
      "Te queremos cómodos. Si estás cómodo, las fotos cambian. Por eso priorizamos la relación con vos antes que un set de luces espectacular.",
  },
  {
    n: "02",
    title: "Documental, no decorativo.",
    body:
      "No coreografiamos lo que ya pasa. Buscamos los gestos chicos: la mano que tiembla, el chiste de la mesa, la primera mirada después del sí.",
  },
  {
    n: "03",
    title: "Editorial, siempre.",
    body:
      "Cuidamos la luz, la composición y el ritmo. Una boda merece el mismo tratamiento estético que una nota de revista — no menos.",
  },
];
