"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Blockers = { galleries?: number; paidBookings?: number; orders?: number };

function blockedMessage(b: Blockers) {
  const parts: string[] = [];
  if (b.galleries) parts.push(`${b.galleries} ${b.galleries === 1 ? "galería" : "galerías"} (borralas primero desde cada galería)`);
  if (b.paidBookings) parts.push(`${b.paidBookings} ${b.paidBookings === 1 ? "seña cobrada" : "señas cobradas"}`);
  if (b.orders) parts.push(`${b.orders} ${b.orders === 1 ? "pedido" : "pedidos"}`);
  return `No se puede borrar porque tiene ${parts.join(", ")}. Así no se pierden fotos ni registros de pagos.`;
}

export default function DeleteRecordButton({
  url,
  label,
  confirmText,
  redirectTo,
  className = "adm-sel-link adm-del-link",
}: {
  url: string;
  label: string;
  confirmText: string;
  redirectTo?: string;
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!confirm(confirmText)) return;
    setBusy(true);
    try {
      const res = await fetch(url, { method: "DELETE" });
      if (res.status === 409) {
        alert(blockedMessage((await res.json()) as Blockers));
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      if (redirectTo) router.replace(redirectTo);
      router.refresh();
    } catch {
      alert("No se pudo borrar. Revisá tu conexión y probá de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button type="button" className={className} onClick={run} disabled={busy}>
      {busy ? "Borrando…" : label}
    </button>
  );
}
