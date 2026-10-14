import { contact, finalCopy, groupon } from "@/content/site";
import { ContactLines } from "../ui";

export function FinalCall() {
  return (
    <section
      id="contact"
      className="panel panel--blue final"
      data-tone="dark"
      aria-labelledby="contact-title"
    >
      <div className="panel__inner wrap">
        <div className="centered">
          <h2 id="contact-title">{finalCopy.title}</h2>
          <p className="lede">{finalCopy.lede}</p>
          <p className="mt-8">
            <a className="btn btn--primary" href="#experiences">
              {finalCopy.cta}
            </a>
          </p>
        </div>
        <div className="final__grid">
          <ContactLines />
          <div className="voucher" data-tone="light">
            <div className="voucher__half">
              <h3>{groupon.title}</h3>
              <p>{groupon.text}</p>
            </div>
            <div className="voucher__half">
              <p className="voucher__links">
                <a className="text-link" href={contact.phone.href}>
                  Call {contact.phone.display}
                </a>
                <a className="text-link" href={contact.email.href}>
                  Email {contact.email.display}
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
