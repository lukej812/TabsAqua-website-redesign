import { contact, finalCopy, groupon } from "@/content/site";
import { Emph } from "../emph";
import { ChevronDownIcon, TicketIcon } from "../icons";
import { ContactLines } from "../ui";

export function Contact() {
  return (
    <section id="contact" className="frame section contact" aria-labelledby="contact-title">
      <div className="contact__bubbles" aria-hidden="true" data-anim>
        {Array.from({ length: 7 }, (_, i) => (
          <span key={i} className="bubble" />
        ))}
      </div>
      <div className="container">
        <h2 id="contact-title" className="contact__title display" data-reveal>
          <Emph text={finalCopy.title} />
        </h2>
        <p className="lead contact__lede" data-reveal>
          {finalCopy.lede}
        </p>
        <div className="contact__grid">
          <div data-reveal>
            <ContactLines />
          </div>
          <details className="ticket glass" data-reveal>
            <summary className="ticket__summary">
              <TicketIcon size={24} />
              <span className="ticket__title">{groupon.title}</span>
              <span className="ticket__toggle label">
                {groupon.toggle}
                <ChevronDownIcon size={18} className="ticket__chevron" />
              </span>
            </summary>
            <div className="ticket__body">
              <p>{groupon.text}</p>
              <p className="ticket__links">
                <a className="text-link" href={contact.phone.href}>
                  Call {contact.phone.display}
                </a>
                <a className="text-link" href={contact.email.href}>
                  Email {contact.email.display}
                </a>
              </p>
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}
