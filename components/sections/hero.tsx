import Image from "next/image";
import type { CSSProperties } from "react";
import {
  contact,
  guidedDescent,
  hero,
  meetingPoint,
  photos,
  services,
  social,
  testimonial,
} from "@/content/site";
import { descentMediaPresent } from "@/lib/public-files";
import { heroVideoSources, photoSrc } from "@/lib/photos";
import { RiseText } from "../emph";
import { AmbientVideo } from "../hero/AmbientVideo";
import { HeroCanvas } from "../hero/HeroCanvas";
import { HeroCarousel } from "../hero/HeroCarousel";
import { HeroGlow } from "../hero/HeroGlow";
import { VideoCard } from "../hero/VideoCard";
import {
  ArrowDownRightIcon,
  ArrowRightIcon,
  DirectionsIcon,
  FishIcon,
  MailIcon,
  MaskIcon,
  PhoneIcon,
  TankIcon,
} from "../icons";
import { BridgeLineArt } from "../illustrations";

const ICON = {
  "discover-scuba": <TankIcon size={26} />,
  snorkeling: <MaskIcon size={26} />,
  "guided-tours": <FishIcon size={26} />,
} as const;

/** Entrance delay for a CSS fade, in ms. The whole entrance ends by about 600ms. */
const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

/** Guided descent footage, if it exists at build time. Without it the card shows the bridge. */
function descentFootage() {
  const { assets } = guidedDescent;
  const mp4 = descentMediaPresent(assets.mp4) ? assets.mp4 : undefined;
  const webm = descentMediaPresent(assets.webm) ? assets.webm : undefined;
  if (!mp4 && !webm) return undefined;
  const mobile = descentMediaPresent(assets.mobileMp4) ? assets.mobileMp4 : undefined;
  return {
    mp4,
    webm,
    preview: mobile ?? mp4 ?? (webm as string),
    poster: descentMediaPresent(assets.poster) ? assets.poster : undefined,
  };
}

/** The reference frame: dim water lit from the surface, thin type bottom left, glass on the right. */
export function Hero() {
  const photo = photoSrc("hero");
  const video = heroVideoSources();
  const footage = descentFootage();

  const slides = hero.cards.map((card) => {
    const service = services[card.serviceId];
    return {
      key: card.serviceId,
      name: service.name,
      content: (
        <article className="mini-card glass glass-blur">
          <div className="mini-card__top">
            <span className="mini-card__icon">{ICON[card.serviceId]}</span>
            <a className="icon-btn mini-card__go nudge-host" href={`#${card.serviceId}`}>
              <ArrowDownRightIcon size={18} className="btn__icon btn__icon--nudge-up" />
              <span className="sr-only">See {service.name} details</span>
            </a>
          </div>
          <p className="mini-card__name">{service.name}</p>
          <p className="mini-card__price label">{service.price}</p>
          <p className="mini-card__fact">{card.fact}</p>
        </article>
      ),
    };
  });

  return (
    <section id="top" className="hero frame" aria-labelledby="hero-title">
      <div className="hero__bg" aria-hidden="true">
        {video ? (
          <AmbientVideo className="hero__media" mp4={video.mp4} webm={video.webm} poster={video.poster} />
        ) : photo ? (
          <Image src={photo} alt={photos.hero.alt} fill priority sizes="100vw" className="hero__media" />
        ) : null}
        <HeroCanvas
          className={`hero__canvas${video || photo ? " hero__canvas--over-media" : ""}`}
          causticsOnly={Boolean(video || photo)}
        />
        <div className="hero__scrim" />
        <HeroGlow />
      </div>

      <ul className="hero__rail" aria-label="Contact">
        <li>
          <a className="rail-btn" href={contact.phone.href}>
            <PhoneIcon size={18} />
            <span className="rail-btn__tip">{hero.rail.call}</span>
          </a>
        </li>
        <li>
          <a className="rail-btn" href={contact.email.href}>
            <MailIcon size={18} />
            <span className="rail-btn__tip">{hero.rail.email}</span>
          </a>
        </li>
        <li>
          <a className="rail-btn" href={meetingPoint.mapsUrl} target="_blank" rel="noopener noreferrer">
            <DirectionsIcon size={18} />
            <span className="rail-btn__tip">
              {hero.rail.directions}
              <span className="sr-only"> to {meetingPoint.name} (opens in a new tab)</span>
            </span>
          </a>
        </li>
        {social.map((item) => (
          <li key={item.href}>
            <a className="rail-btn" href={item.href} target="_blank" rel="noopener noreferrer">
              <span aria-hidden="true">{item.label.slice(0, 1)}</span>
              <span className="rail-btn__tip">
                {item.label}
                <span className="sr-only"> (opens in a new tab)</span>
              </span>
            </a>
          </li>
        ))}
      </ul>

      <div className="hero__inner">
        <div className="hero__copy" data-hero-drift>
          <p className="hero__eyebrow label enter-fade">{hero.eyebrow}</p>
          <h1 id="hero-title" className="hero__title">
            <RiseText text={hero.title} />
          </h1>
          <p className="hero__lead-line enter-fade" style={delay(160)}>
            {hero.leadLine}
          </p>
          <p className="hero__lede enter-fade" style={delay(200)}>
            {hero.lede}
          </p>
          <div className="hero__actions enter-fade" style={delay(240)}>
            <a className="btn btn--primary" href={hero.primaryCta.href} data-magnetic>
              {hero.primaryCta.label}
              <ArrowRightIcon size={18} className="btn__icon btn__icon--nudge" />
            </a>
            <a className="text-link" href={hero.secondaryCta.href}>
              {hero.secondaryCta.label}
            </a>
          </div>
        </div>

        <div className="hero__objects enter-fade" style={delay(220)} data-hero-drift>
          {footage ? (
            <VideoCard
              title={hero.videoCard.title}
              playLabel={hero.videoCard.play}
              closeLabel={hero.videoCard.close}
              previewSrc={footage.preview}
              mp4={footage.mp4}
              webm={footage.webm}
              poster={footage.poster}
            />
          ) : (
            <a className="media-card glass glass-blur nudge-host" href="#where">
              <BridgeLineArt className="media-card__art" />
              <span className="media-card__shade" aria-hidden="true" />
              <span className="media-card__text">
                <span className="media-card__title">{hero.meetCard.title}</span>
                <span className="media-card__link">{hero.meetCard.link}</span>
              </span>
              <span className="icon-btn media-card__go" aria-hidden="true">
                <ArrowDownRightIcon size={18} className="btn__icon btn__icon--nudge-up" />
              </span>
            </a>
          )}

          <HeroCarousel
            label="Experiences at a glance"
            slides={slides}
            chip={
              <a className="quote-chip glass glass-blur" href="#testimonial">
                <span className="quote-chip__mark" aria-hidden="true">
                  &ldquo;
                </span>
                <span className="quote-chip__text">
                  <span className="quote-chip__quote">&ldquo;{hero.quoteChip}&rdquo;</span>
                  <span className="quote-chip__by">{testimonial.name}</span>
                </span>
              </a>
            }
          />
        </div>
      </div>

      <a className="hero__cue label" href="#guided-descent" data-anim>
        {hero.scrollCue}
        <span className="hero__cue-line" aria-hidden="true" />
      </a>
    </section>
  );
}
