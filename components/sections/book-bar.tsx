import { contact, headerCopy } from "@/content/site";
import { PhoneIcon } from "../icons";

/** Sticky booking actions for phones. Hidden from 768px up, and while the menu is open. */
export function BookBar() {
  return (
    <nav className="book-bar" aria-label="Quick booking">
      <a className="btn btn--primary" href="#experiences">
        {headerCopy.bookCta}
      </a>
      <a className="btn btn--glass" href={contact.phone.href}>
        <PhoneIcon size={18} />
        Call
      </a>
    </nav>
  );
}
