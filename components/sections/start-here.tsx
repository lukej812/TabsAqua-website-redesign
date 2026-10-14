import { services, startHere } from "@/content/site";

/** The price row, laid out like the reference's awards row. */
export function StartHere() {
  return (
    <section id="start-here" className="panel panel--white" data-tone="light" aria-labelledby="start-title">
      <div className="panel__inner wrap">
        <div className="centered">
          <h2 id="start-title" className="display">
            {startHere.title} <span className="soft">{startHere.titleSoft}</span>
          </h2>
          <p className="lede">{startHere.intro}</p>
        </div>
        <ul className="ways__list">
          {startHere.paths.map((path) => {
            const service = services[path.price.serviceId];
            return (
              <li className="ways__item" key={path.label}>
                <p className="ways__label caps">{path.label}</p>
                <p className="ways__price">
                  {path.price.from && <small>From</small>}
                  {service.price}
                </p>
                <p className="ways__detail caps">{path.detail}</p>
                <a className="text-link" href={path.href}>
                  {path.link}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
