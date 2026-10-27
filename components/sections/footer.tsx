import { business, copyrightYear, meetingPoint } from "@/content/site";
import { BOOK_LINK, NAV_LINKS, Wordmark } from "./header";

export function SiteFooter() {
  return (
    <footer className="site-footer" data-tone="dark">
      <div className="wrap">
        <div className="site-footer__top">
          <Wordmark link={false} />
          <nav aria-label="Footer">
            <ul className="site-footer__links">
              {[...NAV_LINKS, { href: "#contact", label: "Contact" }, BOOK_LINK].map((link) => (
                <li key={link.href}>
                  <a className="site-nav__link" href={link.href}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="site-footer__bottom">
          <p>
            Snorkel and scuba experiences meet at {meetingPoint.name}, {meetingPoint.locality.split(",")[0]}.
          </p>
          <p>
            © {copyrightYear} {business.name}
          </p>
        </div>
      </div>
    </footer>
  );
}
