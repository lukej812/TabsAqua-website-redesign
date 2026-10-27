import { CloseIcon, DiveFlag, MenuIcon } from "../icons";

export const NAV_LINKS = [
  { href: "#experiences", label: "Experiences" },
  { href: "#certification", label: "Courses" },
  { href: "#groups", label: "Groups" },
  { href: "#where-we-meet", label: "Where we meet" },
  { href: "#faq", label: "FAQ" },
];

export const BOOK_LINK = { href: "#book", label: "Book a dive" };

export function Wordmark({ link = true }: { link?: boolean }) {
  const content = (
    <>
      <DiveFlag className="wordmark__flag" />
      <span>Tabs AquaQuest</span>
    </>
  );
  if (!link) return <p className="wordmark">{content}</p>;
  return (
    <a className="wordmark" href="#top">
      {content}
      <span className="sr-only"> Diving, back to top</span>
    </a>
  );
}

/**
 * Links on the left, the name in the middle, booking on the right. Clear over
 * the sky at the top of the page, then a solid bar once you start to scroll
 * (page-script sets data-scrolled). Without script it is always the solid bar.
 */
export function SiteHeader() {
  return (
    <header className="site-header" data-tone="dark">
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
          <a className="btn btn--primary btn--small" href={BOOK_LINK.href}>
            {BOOK_LINK.label}
          </a>
        </div>
        <details className="menu">
          <summary>
            <MenuIcon className="menu__icon menu__icon-open" />
            <CloseIcon className="menu__icon menu__icon-close" />
            Menu
          </summary>
          <div className="menu__panel" data-tone="light">
            <ul>
              {[...NAV_LINKS, { href: "#contact", label: "Contact" }].map((link) => (
                <li key={link.href}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
            <a className="btn btn--primary menu__book" href={BOOK_LINK.href}>
              {BOOK_LINK.label}
            </a>
          </div>
        </details>
      </nav>
    </header>
  );
}
