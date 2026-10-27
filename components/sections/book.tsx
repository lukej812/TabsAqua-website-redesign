import { bookCopy, bookingUrl, contact, groupon, serviceFor, services, type ServiceId } from "@/content/site";
import { ArrowIcon, ExternalIcon } from "../icons";
import { BookButton, ContactLines } from "../ui";

const ALL: ServiceId[] = ["snorkeling", "discover-scuba", "guided-tours", "open-water", "advanced", "rescue"];

/**
 * Back at the surface: the booking destination. A one-question chooser points
 * each kind of visitor at the right booking page. It is plain radio buttons and
 * CSS, so it works without JavaScript; without :has() support every answer shows.
 * Below it, every service and price, then the contact lines and Groupon note.
 */
export function Book() {
  return (
    <section id="book" className="zone zone--surface" data-tone="light" aria-labelledby="book-title">
      <div className="zone__sun" aria-hidden="true" />
      <div className="wrap zone__inner">
        <header className="zone__head zone__head--center">
          <p className="kicker">{bookCopy.kicker}</p>
          <h2 id="book-title" className="display" data-reveal>
            {bookCopy.title}
          </h2>
          <p className="lede">{bookCopy.lede}</p>
        </header>

        <div className="chooser">
          <fieldset className="chooser__q">
            <legend>{bookCopy.chooserTitle}</legend>
            <div className="chooser__opts">
              {bookCopy.paths.map((path, i) => (
                <label className="chooser__opt" key={path.id}>
                  <input type="radio" name="start" value={path.id} id={`start-${path.id}`} defaultChecked={i === 0} />
                  <span>{path.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="chooser__answers" aria-live="polite">
            {bookCopy.paths.map((path) => (
              <div className="chooser__answer" data-for={path.id} key={path.id}>
                <h3>{path.title}</h3>
                <p>{path.text}</p>
                <ul className="picks">
                  {path.services.map((id) => (
                    <li className="pick" key={id}>
                      <p className="pick__name">{services[id].name}</p>
                      <p className="pick__for">{serviceFor[id]}</p>
                      <p className="pick__price">
                        <span className="sr-only">Price: </span>
                        {services[id].price}
                      </p>
                      <BookButton id={id} small />
                    </li>
                  ))}
                </ul>
                {path.link && (
                  <a className="text-link" href={path.link.href}>
                    {path.link.label}
                    <ArrowIcon size={17} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="book__grid">
          <div className="pricelist">
            <h3>{bookCopy.listTitle}</h3>
            <ul>
              {ALL.map((id) => (
                <li key={id}>
                  <a href={`#${id}`} className="pricelist__name">
                    {services[id].name}
                  </a>
                  <span className="pricelist__for">{serviceFor[id]}</span>
                  <span className="pricelist__price">{services[id].price}</span>
                  <a className="pricelist__book" href={bookingUrl(id)}>
                    Book<span className="sr-only"> {services[id].name} (booking calendar)</span>
                    <ExternalIcon size={16} />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div id="contact" className="contact">
            <h3>{bookCopy.contactTitle}</h3>
            <ContactLines />
            <div className="voucher">
              <h4>{groupon.title}</h4>
              <p>{groupon.text}</p>
              <p className="voucher__links">
                <a className="text-link" href={contact.phone.href}>
                  Call {contact.phone.display}
                </a>
                <a className="text-link" href={contact.email.href}>
                  Email Tabitha
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
