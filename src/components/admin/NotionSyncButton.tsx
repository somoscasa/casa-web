"use client";

import { useState } from "react";

export default function NotionSyncButton() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const sync = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/notion/sync", { method: "POST" });
      const data = (await res.json()) as {
        ok?: boolean;
        synced?: number;
        error?: string;
      };
      if (res.ok && data.ok) {
        setMsg(`✓ ${data.synced} sincronizadas`);
      } else {
        setMsg(
          data.error === "notion_not_configured"
            ? "Falta conectar Notion"
            : data.error?.includes("_404")
            ? "Notion no encuentra la base “Bodas CASA”: compartila con la conexión “Casa” en Notion"
            : data.error?.includes("_401")
            ? "La clave de Notion venció: hay que generar una nueva"
            : "Error al sincronizar con Notion. Probá de nuevo en un rato",
        );
      }
    } catch {
      setMsg("Error al sincronizar");
    } finally {
      setBusy(false);
    }
  };

  return (
    <span className="cal-sync">
      <button
        className="btn btn-outline adm-row-btn"
        onClick={sync}
        disabled={busy}
      >
        {busy ? "Sincronizando…" : "Sincronizar con Notion"}
      </button>
      {msg && <span className="label cal-sync-msg">{msg}</span>}
    </span>
  );
}
