"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function HeroHeader() {
  const [stuck, setStuck] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > window.innerHeight * 0.7);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleHash = (e: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
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
            <a href="#proceso" onClick={(e) => handleHash(e, "#proceso")}>Proceso</a>
            <a href="#servicios" onClick={(e) => handleHash(e, "#servicios")}>Servicios</a>
            <a href="#nosotros" onClick={(e) => handleHash(e, "#nosotros")}>Nosotros</a>
            <a href="#contacto" onClick={(e) => handleHash(e, "#contacto")}>Contacto</a>
            <Link href="/clientes" className="lo-nav-cta">Area Clientes</Link>
          </nav>
          <button
            className={`lo-burger${open ? " lo-open" : ""}`}
            aria-label="Menu"
            onClick={() => setOpen(!open)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>
      <div className={`lo-drawer${open ? " lo-open" : ""}`}>
        <Link href="/portfolio" onClick={() => setOpen(false)}>Portfolio</Link>
        <a href="#proceso" onClick={(e) => handleHash(e, "#proceso")}>Proceso</a>
        <a href="#servicios" onClick={(e) => handleHash(e, "#servicios")}>Servicios</a>
        <a href="#nosotros" onClick={(e) => handleHash(e, "#nosotros")}>Nosotros</a>
        <a href="#contacto" onClick={(e) => handleHash(e, "#contacto")}>Contacto</a>
        <Link href="/clientes" onClick={() => setOpen(false)}>Area Clientes</Link>
      </div>
    </>
  );
}
