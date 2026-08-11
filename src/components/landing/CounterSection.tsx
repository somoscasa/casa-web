"use client";

import { useEffect, useRef, useState } from "react";

const STATS = [
  { target: 9, suffix: "", label: "Años filmando" },
  { target: 240, suffix: "+", label: "Celebraciones" },
  { target: 20, suffix: "", label: "Personas en el equipo" },
  { target: 14, suffix: "", label: "Provincias recorridas" },
];

function Counter({
  target,
  suffix,
  label,
}: {
  target: number;
  suffix: string;
  label: string;
}) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1800;
          const start = performance.now();
          const step = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return (
    <div className="lo-num" ref={ref}>
      <b>
        {value}
        {suffix}
      </b>
      <span>{label}</span>
    </div>
  );
}

export default function CounterSection() {
  return (
    <section className="lo-nums">
      <div className="wrap">
        <div className="lo-nums-grid">
          {STATS.map((s) => (
            <Counter
              key={s.label}
              target={s.target}
              suffix={s.suffix}
              label={s.label}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
