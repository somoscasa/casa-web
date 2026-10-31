"use client";

import { useState, type ReactNode } from "react";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function SearchableList({
  items,
  placeholder,
  noun,
  className,
}: {
  items: { id: string; text: string; node: ReactNode }[];
  placeholder: string;
  noun: [string, string];
  className?: string;
}) {
  const [q, setQ] = useState("");
  const query = norm(q.trim());
  const shown = query ? items.filter((i) => norm(i.text).includes(query)) : items;

  return (
    <>
      <div className="adm-search">
        <input
          type="search"
          className="adm-input"
          placeholder={placeholder}
          aria-label={placeholder}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <span className="label">
          {query ? `${shown.length} de ${items.length}` : `${items.length} ${items.length === 1 ? noun[0] : noun[1]}`}
        </span>
      </div>
      {shown.length === 0 ? (
        <p className="serif-italic adm-cli-empty">Nada coincide con &ldquo;{q}&rdquo;.</p>
      ) : (
        <ul className={className}>
          {shown.map((i) => (
            <li key={i.id}>{i.node}</li>
          ))}
        </ul>
      )}
    </>
  );
}
