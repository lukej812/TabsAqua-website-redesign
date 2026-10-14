import { services } from "@/content/site";

/**
 * Slow, CSS-only ticker of every service. Pauses on hover, sits still under
 * reduced motion, and pauses offscreen. The second copy exists only to make
 * the loop seamless, so it is hidden from screen readers.
 */
export function ServicesMarquee() {
  const names = Object.values(services).map((s) => s.name);
  return (
    <section className="marquee" aria-label="What Tabitha offers" data-anim>
      <div className="marquee__track">
        {[0, 1].map((copy) => (
          <ul key={copy} className="marquee__list" aria-hidden={copy === 1 ? true : undefined}>
            {names.map((name) => (
              <li key={name} className="marquee__item">
                {name}
                <span className="marquee__dot" aria-hidden="true" />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </section>
  );
}
