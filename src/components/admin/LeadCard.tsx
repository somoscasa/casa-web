"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  STAGES,
  STAGE_LABEL,
  normalizeStage,
  formatDate,
  packageName,
} from "@/lib/crm";

export type Lead = {
  id: string;
  clientId: string | null;
  name: string;
  type: string | null;
  date: string | null;
  package: string | null;
  status: string;
  notes: string | null;
  deposit: number | null;
  paid: boolean;
};

function typeLabel(t: string | null): string {
  if (!t) return "Evento";
  if (t === "boda") return "Boda";
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export default function LeadCard({ lead }: { lead: Lead }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(lead.notes ?? "");

  const stage = normalizeStage(lead.status);

  const patch = async (body: Record<string, string | null>) => {
    setBusy(true);
    const res = await fetch(`/api/admin/events/${lead.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (res.ok) {
      setEditing(false);
      router.refresh();
    }
  };

  return (
    <div className={`emb-card ${busy ? "emb-card-busy" : ""}`}>
      <div className="emb-card-head">
        <div className="serif emb-card-name">{lead.name}</div>
        {lead.clientId && (
          <Link
            href={`/admin/clientes/${lead.clientId}`}
            className="emb-card-link"
            title="Ver ficha del cliente"
          >
            ↗
          </Link>
        )}
      </div>

      <div className="label emb-card-meta">
        {typeLabel(lead.type)} · {lead.date ? formatDate(lead.date) : "sin fecha"}
        {lead.package ? ` · ${packageName(lead.package)}` : ""}
      </div>

      {lead.deposit ? (
        <span className={`adm-ped-badge ${lead.paid ? "pay-paid" : ""} emb-card-pay`}>
          seña {lead.paid ? "paga" : "pendiente"}
        </span>
      ) : null}

      {editing ? (
        <div className="emb-notes-edit">
          <textarea
            className="emb-notes-input"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas de la consulta…"
          />
          <div className="emb-notes-actions">
            <button
              className="btn btn-siena adm-row-btn"
              disabled={busy}
              onClick={() => patch({ notes })}
            >
              {busy ? "…" : "Guardar"}
            </button>
            <button
              className="btn btn-outline adm-row-btn"
              disabled={busy}
              onClick={() => {
                setEditing(false);
                setNotes(lead.notes ?? "");
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="emb-notes"
          onClick={() => setEditing(true)}
        >
          {lead.notes ? (
            lead.notes
          ) : (
            <span className="emb-notes-empty">+ agregar nota</span>
          )}
        </button>
      )}

      <label className="emb-move">
        <span className="label">mover a</span>
        <select
          className="emb-select"
          value={stage}
          disabled={busy}
          onChange={(e) => patch({ status: e.target.value })}
        >
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {STAGE_LABEL[s]}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
