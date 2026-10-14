import { faq, faqCopy } from "@/content/site";
import { AskTabitha } from "../ui";

export function Faq() {
  return (
    <section id="faq" className="panel panel--white" data-tone="light" aria-labelledby="faq-title">
      <div className="panel__inner wrap faq">
        <div className="faq__head">
          <h2 id="faq-title">{faqCopy.title}</h2>
          <p className="lede">{faqCopy.intro}</p>
        </div>
        <div className="faq__list">
          {faq.map((entry) => (
            <details className="faq__item" key={entry.id} id={`faq-${entry.id}`}>
              <summary>{entry.question}</summary>
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
