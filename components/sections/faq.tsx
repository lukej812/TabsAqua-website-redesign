import { faq, faqCopy } from "@/content/site";
import { Emph } from "../emph";
import { ChevronDownIcon } from "../icons";
import { AskTabitha } from "../ui";

/** Native <details> rows. The height animates in CSS where supported, instantly elsewhere. */
export function Faq() {
  return (
    <section id="faq" className="frame section faq" aria-labelledby="faq-title">
      <div className="container faq__grid">
        <div className="section-head" data-reveal>
          <h2 id="faq-title" className="h2">
            <Emph text={faqCopy.title} />
          </h2>
          <p className="lead">{faqCopy.intro}</p>
        </div>
        <div className="faq__list" data-reveal>
          {faq.map((entry) => (
            <details className="faq__item glass" key={entry.id} id={`faq-${entry.id}`}>
              <summary>
                <span>{entry.question}</span>
                <ChevronDownIcon size={20} className="faq__chevron" />
              </summary>
              <div className="faq__answer">
                {entry.answer && <p>{entry.answer}</p>}
                {entry.open && <AskTabitha topic={entry.open} />}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
