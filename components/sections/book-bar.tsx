import { contact } from "@/content/site";
import { PhoneIcon } from "../icons";
import { BOOK_LINK } from "./header";

/**
 * Sticky booking actions for phones. Hidden from 768px up, where the header
 * has them, and tucked away while the booking section itself is on screen.
 */
export function BookBar() {
  return (
    <nav className="book-bar" data-tone="dark" aria-label="Quick booking">
      <a className="btn btn--primary" href={BOOK_LINK.href}>
        {BOOK_LINK.label}
      </a>
      <a className="btn btn--ghost" href={contact.phone.href}>
        <PhoneIcon size={18} />
        Call
      </a>
    </nav>
  );
}
