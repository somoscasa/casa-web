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
  { href: "/nosotros", label: "NOSOTROS" },
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
  { src: "/portfolio/01-ceremonia.jpeg", alt: "Boda · Ceremonia", ratio: "tall" },
  { src: "/portfolio/02-detalles.jpeg", alt: "Detalles · Getting ready", ratio: "sq" },
  { src: "/portfolio/03-manos.jpeg", alt: "Manos · Anillos", ratio: "wide" },
  { src: "/portfolio/04-abrazo.jpeg", alt: "El abrazo · Retrato", ratio: "tall" },
];

type PortfolioItem = {
  id: string;
  title: string;
  sub: string;
  src: string;
};

export const PORTFOLIO: PortfolioItem[] = [
  { id: "p01", title: "La ceremonia", sub: "Boda · Detalle", src: "/portfolio/01-ceremonia.jpeg" },
  { id: "p02", title: "Detalles", sub: "Getting ready", src: "/portfolio/02-detalles.jpeg" },
  { id: "p03", title: "El sí", sub: "Manos · Anillos", src: "/portfolio/03-manos.jpeg" },
  { id: "p04", title: "El abrazo", sub: "Retrato · Pareja", src: "/portfolio/04-abrazo.jpeg" },
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
