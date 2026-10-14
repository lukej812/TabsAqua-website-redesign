import { business, contact, footerCopy, nav } from "@/content/site";
import { Emblem } from "../emblem";
import { ArrowUpIcon } from "../icons";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__top">
        <div className="site-footer__brand">
          <Emblem className="emblem site-footer__emblem" />
          <p className="site-footer__name">{business.name}</p>
        </div>
        <nav id="footer-nav" aria-label="Footer">
          <ul className="site-footer__links">
            {nav.map((item) => (
              <li key={item.id}>
                <a className="site-footer__link label" href={`#${item.id}`}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="site-footer__contact">
          <a className="text-link" href={contact.phone.href}>
            {contact.phone.display}
          </a>
          <a className="text-link" href={contact.email.href}>
            {contact.email.display}
          </a>
        </div>
      </div>
      <div className="site-footer__bottom">
        <p>{footerCopy.bookingNote}</p>
        <p>© {business.name}</p>
        <a className="text-link" href="#top">
          <ArrowUpIcon size={16} />
          {footerCopy.backToTop}
        </a>
      </div>
    </footer>
  );
}
