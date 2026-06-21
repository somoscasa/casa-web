import { PACKAGES } from "@/lib/site";

/** Estados de pago que cuentan como facturado/cobrado. */
export const PAID = new Set(["paid", "approved"]);

export function isPaid(status: string | null | undefined): boolean {
  return PAID.has((status ?? "").toLowerCase());
}

/** Nombre legible de un paquete a partir de su id. */
export function packageName(id: string | null | undefined): string {
  if (!id) return "—";
  return PACKAGES.find((p) => p.id === id)?.name ?? id;
}

export const PAY_LABEL: Record<string, string> = {
  pending: "pendiente",
  paid: "pagado",
  approved: "pagado",
  rejected: "rechazado",
  cancelled: "cancelado",
};

export const SHIP_LABEL: Record<string, string> = {
  pending: "pendiente",
  preparando: "preparando",
  enviado: "enviado",
  entregado: "entregado",
};

export function payLabel(s: string | null | undefined): string {
  const k = (s ?? "").toLowerCase();
  return PAY_LABEL[k] ?? k ?? "—";
}

export function shipLabel(s: string | null | undefined): string {
  const k = (s ?? "").toLowerCase();
  return SHIP_LABEL[k] ?? k ?? "—";
}

/* ───────────────────────── Embudo de reservas ─────────────────────────
 * El estado del embudo vive en events.status (columna ya existente).
 * Pipeline lineal: consulta → reservada → fotografiada → entregada.
 * 'perdida' es una columna de archivo aparte. El legacy 'pendiente' (y
 * cualquier valor desconocido) se normaliza a 'consulta'.
 */
export const STAGES = [
  "consulta",
  "reservada",
  "fotografiada",
  "entregada",
  "perdida",
] as const;
export type Stage = (typeof STAGES)[number];

/** Columnas del tablero, en orden de embudo. */
export const PIPELINE: Stage[] = [
  "consulta",
  "reservada",
  "fotografiada",
  "entregada",
];

export const STAGE_LABEL: Record<Stage, string> = {
  consulta: "Consulta",
  reservada: "Reservada",
  fotografiada: "Fotografiada",
  entregada: "Entregada",
  perdida: "Perdida",
};

const STAGE_SET = new Set<string>(STAGES);

/** Normaliza cualquier valor de status a un Stage válido (legacy → consulta). */
export function normalizeStage(s: string | null | undefined): Stage {
  const k = (s ?? "").toLowerCase();
  return STAGE_SET.has(k) ? (k as Stage) : "consulta";
}

export function stageLabel(s: string | null | undefined): string {
  return STAGE_LABEL[normalizeStage(s)];
}

/** Siguiente estado en el pipeline lineal (null si ya está al final o es 'perdida'). */
export function nextStage(s: string | null | undefined): Stage | null {
  const i = PIPELINE.indexOf(normalizeStage(s));
  if (i < 0 || i >= PIPELINE.length - 1) return null;
  return PIPELINE[i + 1];
}

/** Estado anterior en el pipeline lineal (null si ya está al inicio o es 'perdida'). */
export function prevStage(s: string | null | undefined): Stage | null {
  const i = PIPELINE.indexOf(normalizeStage(s));
  if (i <= 0) return null;
  return PIPELINE[i - 1];
}

/** Formato de fecha corto en español-AR. */
export function formatDate(d: string | null | undefined): string {
  if (!d) return "sin fecha";
  return new Date(d).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Devuelve la fecha del próximo evento (>= hoy); si no hay, la más reciente. */
export function nextEventDate(
  dates: (string | null | undefined)[],
): string | null {
  const valid = dates.filter((d): d is string => Boolean(d));
  if (valid.length === 0) return null;
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = valid.filter((d) => d >= today).sort();
  if (upcoming.length > 0) return upcoming[0];
  return valid.sort().reverse()[0];
}
