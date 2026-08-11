import Reveal from "@/components/Reveal";

const STEPS = [
  {
    n: "01",
    title: "Charla",
    desc: "Nos conocemos, hablamos de su boda y vemos si hacemos match. Sin compromiso.",
  },
  {
    n: "02",
    title: "Plan",
    desc: "Armamos la propuesta a medida, definimos el paquete y reservamos la fecha.",
  },
  {
    n: "03",
    title: "El dia",
    desc: "Llegamos temprano, nos integramos al evento y capturamos todo lo que importa.",
  },
  {
    n: "04",
    title: "Entrega",
    desc: "Editamos con cuidado. Primero una preview, despues la galeria y el video completo.",
  },
];

export default function ProcessSteps() {
  return (
    <section className="lo-sec" id="proceso">
      <div className="wrap">
        <div className="lo-sec-head">
          <div className="label">Proceso</div>
          <h2>De la primera charla al video final.</h2>
        </div>
        <Reveal>
          <div className="lo-steps">
            {STEPS.map((s) => (
              <div className="lo-step" key={s.n}>
                <div className="lo-sn">Paso {s.n}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
