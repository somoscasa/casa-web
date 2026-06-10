# CASA — Sitio web

Estudio audiovisual de Villa Crespo, Buenos Aires. Bodas y quinces.

> Sentite en casa.

## Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** + design tokens en `globals.css`
- **Framer Motion** para reveals al scroll
- **Resend** para el formulario de contacto
- **Supabase** (DB + Auth + Storage) — provisionado en `supabase/schema.sql`, lo conectamos en Fase 2
- **MercadoPago** para reservas (Fase 3) y tienda (Fase 4)
- Deploy en **Vercel**, versionado en **GitHub** (`somoscasaarc-source/casa-web`)

## Identidad visual

Cuatro colores, dos tipografías. No se mueven.

| Token | Hex | Uso |
| --- | --- | --- |
| Pergamino | `#F7F2E9` | Fondo primario (60%) |
| Ébano | `#1C1714` | Texto + fondos oscuros (25%) |
| Ceniza | `#9B8E85` | Textos secundarios (10%) |
| Siena | `#B5623E` | Único acento (5%) |

- Display / wordmark / citas → **Cormorant Garamond** 400 (`.wordmark`, `.serif`, `.serif-italic`)
- Cuerpo y etiquetas → **DM Sans** 400 (`.body`, `.label`, `.eyebrow`)
- Sin gradientes, sombras, ni efectos. Mucho aire entre bloques.

## Correr en local

```bash
npm install
cp .env.example .env.local   # rellenar las claves cuando las tengamos
npm run dev                  # http://localhost:3000
```

## Estructura

```
src/
  app/
    layout.tsx                # Fonts (Cormorant + DM Sans) + metadata
    globals.css               # Sistema de diseño completo
    page.tsx                  # Home
    bodas/page.tsx
    quinces/page.tsx
    nosotros/page.tsx
    contacto/page.tsx
    api/contact/route.ts      # POST → Resend
  components/
    Header.tsx                # Sticky + drawer mobile
    Footer.tsx                # Ébano + links
    Reveal.tsx                # Fade-up on viewport (Framer Motion)
    PackageCard.tsx
    EditorialGallery.tsx      # Grilla asimétrica de 12 col
    FAQ.tsx                   # Accordion animado
    ContactForm.tsx           # Validación + POST /api/contact
  lib/
    site.ts                   # Copy, paquetes, FAQ, testimonios, imágenes
supabase/
  schema.sql                  # Tablas de Fases 2-4 + bucket de fotos
```

## Estado por fase

### ✅ Fase 1 — Portfolio público (este commit)
- Home, Bodas, Quinces, Nosotros, Contacto
- Formulario de contacto con envío vía Resend
  - Mientras no haya `RESEND_API_KEY`, la API loguea la consulta y devuelve `200` (fallback dev), así el flujo funciona en local
- Tres paquetes (Esencial / Clásico / Premium) **sin precios**, todos con CTA al formulario o a WhatsApp
- Bloque "servicios a medida" en Home, Bodas y Quinces
- FAQ por evento (6 preguntas cada uno)

### ⏳ Fase 2 — Galerías privadas para clientes
Pendiente. Pre-requisitos:
1. Crear proyecto en Supabase (`somoscasaar` ya tiene cuenta).
2. Correr `supabase/schema.sql` en el editor SQL — crea las tablas y el bucket `photos` privado.
3. Copiar `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` a `.env.local` y a Vercel.
4. Implementar `/clientes/[token]` (galería pública por token), panel admin en `/admin` con magic-link auth y descarga en ZIP.

### ⏳ Fase 3 — Reservas + MercadoPago (seña 40%)
Pre-requisitos:
1. Cuenta de developer en MercadoPago, generar `MERCADOPAGO_ACCESS_TOKEN` y `MERCADOPAGO_PUBLIC_KEY`.
2. Implementar `/reservar`, integración Checkout Pro, webhook `/api/mp/webhook`.
3. Tabla `bookings` ya está en el schema.

### ⏳ Fase 4 — Tienda de impresiones
- Catálogo en `/tienda`, carrito en sesión, checkout con MercadoPago, panel admin de pedidos.
- Tabla `orders` ya está en el schema.

## Deploy a Vercel

El repo está en GitHub: `somoscasaarc-source/casa-web`. Para conectarlo a Vercel:

1. Entrá a https://vercel.com/new y elegí el proyecto `casa-web` desde GitHub.
2. Framework preset: **Next.js** (autodetect).
3. Pegá las variables de `.env.example` con sus valores reales en **Settings → Environment Variables**.
4. Click en **Deploy**. Vercel te da un dominio temporal `casa-web-*.vercel.app` mientras `somoscasa.com.ar` no esté registrado.

Después de cada commit a `main` en GitHub, Vercel hace deploy automático.

## Tono

Español rioplatense, tuteo, cálido pero profesional. Frases cortas. Nada de signos de admiración. Que respire.

> "Cada boda tiene su luz. Nosotros la encontramos."
