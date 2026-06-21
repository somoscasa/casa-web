"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/browser";

export default function AdminTopbar({ email }: { email: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const signOut = async () => {
    setBusy(true);
    const supabase = getBrowserSupabase();
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  return (
    <header className="adm-topbar">
      <Link href="/admin" className="wordmark adm-mark" aria-label="Admin CASA">
        CASA
      </Link>
      <nav className="adm-nav">
        <Link href="/admin" className="adm-link">
          Panel
        </Link>
        <Link href="/admin/embudo" className="adm-link">
          Embudo
        </Link>
        <Link href="/admin/clientes" className="adm-link">
          Clientes
        </Link>
        <Link href="/admin/reservas" className="adm-link">
          Reservas
        </Link>
        <Link href="/admin/pedidos" className="adm-link">
          Pedidos
        </Link>
      </nav>
      <div className="adm-user">
        <span className="label">{email}</span>
        <button
          className="adm-link adm-signout"
          onClick={signOut}
          disabled={busy}
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}
