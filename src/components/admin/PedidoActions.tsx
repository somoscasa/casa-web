"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const NEXT: Record<string, string> = {
  pending: "preparando",
  preparando: "enviado",
  enviado: "entregado",
};

const PAID = new Set(["paid", "approved"]);

export default function PedidoActions({
  orderId,
  shippingStatus,
  paymentStatus,
}: {
  orderId: string;
  shippingStatus: string;
  paymentStatus: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const nextShip = NEXT[shippingStatus];
  const isPaid = PAID.has(paymentStatus);

  const patch = async (body: Record<string, string>) => {
    setBusy(true);
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => null);
    setBusy(false);
    if (res?.ok) router.refresh();
    else alert("No se pudo actualizar el pedido. Recargá la página y probá de nuevo.");
  };

  return (
    <div className="adm-ped-actions">
      {!isPaid ? (
        <button
          className="btn btn-siena adm-row-btn"
          onClick={() => patch({ payment_status: "paid" })}
          disabled={busy}
        >
          {busy ? "…" : "Marcar pagado"}
        </button>
      ) : (
        <span className="adm-ped-paid">✓ Pagado</span>
      )}

      {nextShip ? (
        <button
          className="btn btn-outline adm-row-btn"
          onClick={() => patch({ shipping_status: nextShip })}
          disabled={busy}
        >
          {busy ? "…" : `Marcar ${nextShip}`}
        </button>
      ) : (
        <span className="label adm-ped-closed">Entregado</span>
      )}
    </div>
  );
}
