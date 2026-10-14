import Image from "next/image";
import { hero, photos } from "@/content/site";
import { HeroSea } from "../illustrations";

export function Hero() {
  const photo: { src?: string; alt: string } = photos.hero;
  return (
    <section
      id="top"
      className={`panel hero${photo.src ? " hero--photo" : ""}`}
      data-tone="light"
      aria-labelledby="hero-title"
    >
      {photo.src && (
        <Image src={photo.src} alt={photo.alt} fill priority sizes="100vw" className="hero__photo" />
      )}
      <div className="hero__content">
        <h1 id="hero-title">{hero.title}</h1>
        <p className="hero__lede">{hero.lede}</p>
        <div className="hero__actions">
          <a className="btn btn--primary" href="#experiences">
            {hero.primaryCta}
          </a>
          <a className="text-link" href="#start-here">
            {hero.secondaryCta}
          </a>
        </div>
      </div>
      {!photo.src && <HeroSea />}
    </section>
  );
}
