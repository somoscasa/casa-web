"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function HeroHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [stuck, setStuck] = useState(!isHome);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isHome) {
      setStuck(true);
      return;
    }
    const onScroll = () => setStuck(window.scrollY > window.innerHeight * 0.7);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const hashHref = (hash: string) => (isHome ? hash : `/${hash}`);

  const handleHash = (e: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
    if (!isHome) return;
    e.preventDefault();
    setOpen(false);
    const el = document.querySelector(hash);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <header className={`lo-header${stuck ? " lo-stuck" : ""}`}>
        <div className="wrap">
          <Link href="/" className="lo-logo wordmark">
            C A S A
          </Link>
          <nav className="lo-nav">
            <Link href="/portfolio">Portfolio</Link>
            <a href={hashHref("#proceso")} onClick={(e) => handleHash(e, "#proceso")}>Proceso</a>
            <a href={hashHref("#servicios")} onClick={(e) => handleHash(e, "#servicios")}>Servicios</a>
            <a href={hashHref("#nosotros")} onClick={(e) => handleHash(e, "#nosotros")}>Nosotros</a>
            <a href={hashHref("#contacto")} onClick={(e) => handleHash(e, "#contacto")}>Contacto</a>
            <Link href="/clientes" className="lo-nav-cta">Area Clientes</Link>
          </nav>
          <button
            className={`lo-burger${open ? " lo-open" : ""}`}
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>
      <div className={`lo-drawer${open ? " lo-open" : ""}`} aria-hidden={!open}>
        <Link href="/portfolio" onClick={() => setOpen(false)}>Portfolio</Link>
        <a href={hashHref("#proceso")} onClick={(e) => { handleHash(e, "#proceso"); }}>Proceso</a>
        <a href={hashHref("#servicios")} onClick={(e) => { handleHash(e, "#servicios"); }}>Servicios</a>
        <a href={hashHref("#nosotros")} onClick={(e) => { handleHash(e, "#nosotros"); }}>Nosotros</a>
        <a href={hashHref("#contacto")} onClick={(e) => { handleHash(e, "#contacto"); }}>Contacto</a>
        <Link href="/clientes" onClick={() => setOpen(false)}>Area Clientes</Link>
      </div>
    </>
  );
}
