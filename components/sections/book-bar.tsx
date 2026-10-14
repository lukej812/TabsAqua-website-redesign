import { contact } from "@/content/site";
import { PhoneIcon } from "../icons";

/** Sticky booking action for phones. Hidden from 768px up, where the header has it. */
export function BookBar() {
  return (
    <nav className="book-bar" data-tone="light" aria-label="Quick booking">
      <a className="btn btn--primary" href="#experiences">
        Book an experience
      </a>
      <a className="btn btn--quiet" href={contact.phone.href}>
        <PhoneIcon size={18} />
        Call
      </a>
    </nav>
  );
}
