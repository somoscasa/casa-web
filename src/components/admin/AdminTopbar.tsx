"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/browser";

const LINKS: [string, string][] = [
  ["/admin", "Panel"],
  ["/admin/embudo", "Embudo"],
  ["/admin/calendario", "Calendario"],
  ["/admin/clientes", "Clientes"],
  ["/admin/reservas", "Reservas"],
  ["/admin/pedidos", "Pedidos"],
];

export default function AdminTopbar({ email }: { email: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);
  const isActive = (href: string) =>
    href === "/admin"
      ? pathname === "/admin" || pathname.startsWith("/admin/galerias")
      : pathname.startsWith(href);

  const signOut = async () => {
    setBusy(true);
    const supabase = getBrowserSupabase();
    await supabase.auth.signOut().catch(() => null);
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <header className="adm-topbar">
      <Link href="/admin" className="wordmark adm-mark" aria-label="Admin CASA">
        CASA
      </Link>
      <nav className="adm-nav" aria-label="Secciones del Admin">
        {LINKS.map(([href, label]) => (
          <Link
            key={href}
            href={href}
            className={`adm-link${isActive(href) ? " is-active" : ""}`}
            aria-current={isActive(href) ? "page" : undefined}
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className="adm-user">
        <span className="label adm-user-email">{email}</span>
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
