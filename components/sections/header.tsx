import { CloseIcon, MenuIcon } from "../icons";

export const NAV_LINKS = [
  { href: "#experiences", label: "Experiences" },
  { href: "#certification", label: "Courses" },
  { href: "#groups", label: "Groups" },
  { href: "#where-we-meet", label: "Where we meet" },
  { href: "#faq", label: "FAQ" },
];

export function Wordmark({ link = true }: { link?: boolean }) {
  if (!link) return <p className="wordmark">Tabs AquaQuest</p>;
  return (
    <a className="wordmark" href="#top">
      Tabs AquaQuest<span className="sr-only"> Diving, back to top</span>
    </a>
  );
}

/** Links on the left, the name in the middle, booking on the right, like the reference. */
export function SiteHeader() {
  return (
    <header className="site-header" data-tone="light">
      <nav className="site-header__inner" aria-label="Main">
        <ul className="site-nav__list">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a className="site-nav__link" href={link.href}>
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <Wordmark />
        <div className="site-header__end">
          <a className="site-nav__link" href="#contact">
            Contact
          </a>
          <a className="btn btn--primary btn--small" href="#experiences">
            Explore dives
          </a>
        </div>
        <details className="menu">
          <summary>
            <MenuIcon className="menu__icon menu__icon-open" />
            <CloseIcon className="menu__icon menu__icon-close" />
            Menu
          </summary>
          <div className="menu__panel">
            <ul>
              {[...NAV_LINKS, { href: "#contact", label: "Contact" }].map((link) => (
                <li key={link.href}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </div>
        </details>
      </nav>
    </header>
  );
}
