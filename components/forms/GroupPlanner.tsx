"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { contact, planner } from "@/content/site";
import { CopyIcon, MailIcon, PhoneIcon } from "../icons";

type Fields = {
  occasion: string;
  size: string;
  date: string;
  interests: string[];
  name: string;
  notes: string;
};

type Errors = Partial<Record<"occasion" | "size" | "date" | "name", string>>;

const EMPTY: Fields = { occasion: "", size: "", date: "", interests: [], name: "", notes: "" };

function todayIso(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function validate(fields: Fields): Errors {
  const errors: Errors = {};
  if (!fields.occasion) errors.occasion = "Choose the occasion, or pick Something else.";
  const size = Number(fields.size);
  if (!fields.size.trim()) errors.size = "Enter roughly how many people are coming.";
  else if (!Number.isInteger(size) || size < 1) errors.size = "Enter a whole number, like 6.";
  if (fields.date && fields.date < todayIso()) errors.date = "Pick today or a date in the future, or leave it blank.";
  if (!fields.name.trim()) errors.name = "Enter your name so Tabitha knows who is asking.";
  return errors;
}

function formatDate(iso: string): string {
  const date = new Date(`${iso}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

export function composeMessage(fields: Fields): string {
  const lines = [
    "Hi Tabitha,",
    "",
    "I'd like to plan a group outing.",
    "",
    `Occasion: ${fields.occasion}`,
    `Group size: about ${Number(fields.size)}`,
    `Preferred date: ${fields.date ? formatDate(fields.date) : "Flexible"}`,
  ];
  if (fields.interests.length) lines.push(`Interested in: ${fields.interests.join(", ")}`);
  if (fields.notes.trim()) lines.push("", fields.notes.trim());
  lines.push("", "Thanks,", fields.name.trim());
  return lines.join("\n");
}

/**
 * Composes an email to Tabitha in the visitor's own mail app. The site has no
 * server, so nothing is sent from here and the form never claims it was: it
 * says the mail app should open, and offers the message to copy if it doesn't.
 * Rendered only with JavaScript; without it, the phone and email links beside
 * it do the same job.
 */
export function GroupPlanner() {
  const id = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState<string | null>(null);

  const set = <K extends keyof Fields>(key: K, value: Fields[K]) => {
    setFields((current) => ({ ...current, [key]: value }));
    if (key in errors) setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found = validate(fields);
    setErrors(found);
    const firstInvalid = (["occasion", "size", "date", "name"] as const).find((key) => found[key]);
    if (firstInvalid) {
      setMessage(null);
      formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }
    const body = composeMessage(fields);
    setMessage(body);
    const subject = `${planner.subject}: ${fields.occasion}`;
    // A mailto: link hands the message to the visitor's mail app; the page stays put.
    window.open(`${contact.email.href}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_self");
  };

  const describe = (key: keyof Errors, hint?: string) =>
    [hint, errors[key] ? `${id}-${key}-error` : null].filter(Boolean).join(" ") || undefined;

  const error = (key: keyof Errors) =>
    errors[key] ? (
      <p className="field__error" id={`${id}-${key}-error`}>
        {errors[key]}
      </p>
    ) : null;

  return (
    <div className="planner" id="plan" data-tone="light">
      <h3 className="planner__title">{planner.title}</h3>
      <p className="planner__intro">{planner.intro}</p>
      <form ref={formRef} className="planner__form" noValidate onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor={`${id}-occasion`}>Occasion</label>
          <select
            id={`${id}-occasion`}
            name="occasion"
            required
            value={fields.occasion}
            aria-invalid={errors.occasion ? true : undefined}
            aria-describedby={describe("occasion")}
            onChange={(e) => set("occasion", e.target.value)}
          >
            <option value="">Choose one</option>
            {planner.occasions.map((occasion) => (
              <option key={occasion}>{occasion}</option>
            ))}
          </select>
          {error("occasion")}
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor={`${id}-size`}>About how many people?</label>
            <input
              id={`${id}-size`}
              name="size"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              required
              value={fields.size}
              aria-invalid={errors.size ? true : undefined}
              aria-describedby={describe("size")}
              onChange={(e) => set("size", e.target.value)}
            />
            {error("size")}
          </div>
          <div className="field">
            <label htmlFor={`${id}-date`}>
              Preferred date <span className="field__optional">(optional)</span>
            </label>
            <input
              id={`${id}-date`}
              name="date"
              type="date"
              value={fields.date}
              aria-invalid={errors.date ? true : undefined}
              aria-describedby={describe("date")}
              onChange={(e) => set("date", e.target.value)}
            />
            {error("date")}
          </div>
        </div>

        <fieldset className="field">
          <legend>
            Interested in <span className="field__optional">(optional)</span>
          </legend>
          <div className="checks">
            {planner.interests.map((interest) => (
              <label className="check" key={interest}>
                <input
                  type="checkbox"
                  name="interests"
                  value={interest}
                  checked={fields.interests.includes(interest)}
                  onChange={(e) =>
                    set(
                      "interests",
                      e.target.checked
                        ? [...fields.interests, interest]
                        : fields.interests.filter((item) => item !== interest),
                    )
                  }
                />
                <span>{interest}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="field">
          <label htmlFor={`${id}-name`}>Your name</label>
          <input
            id={`${id}-name`}
            name="name"
            type="text"
            autoComplete="name"
            required
            value={fields.name}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={describe("name")}
            onChange={(e) => set("name", e.target.value)}
          />
          {error("name")}
        </div>

        <div className="field">
          <label htmlFor={`${id}-notes`}>
            Anything else? <span className="field__optional">(optional)</span>
          </label>
          <textarea
            id={`${id}-notes`}
            name="notes"
            rows={3}
            maxLength={800}
            value={fields.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn--primary planner__submit">
          <MailIcon size={18} />
          {planner.submit}
        </button>
      </form>

      <div className="planner__status" role="status">
        {message && (
          <div className="planner__done">
            <p>{planner.opened}</p>
            <p>{planner.noApp}</p>
            <p className="planner__actions">
              <button type="button" className="btn btn--quiet btn--small" data-copy={message} data-copy-label="Message">
                <CopyIcon size={17} />
                <span data-copy-text>Copy</span>
                <span className="sr-only"> message</span>
              </button>
              <a className="btn btn--quiet btn--small" href={contact.phone.href}>
                <PhoneIcon size={17} />
                Call {contact.phone.display}
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
