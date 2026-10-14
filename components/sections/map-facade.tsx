"use client";

import { useEffect, useRef, useState } from "react";
import { MapIcon } from "../icons";
import { BridgeLineArt } from "../illustrations";

type Props = { embedUrl: string; title: string; button: string; note: string };

/**
 * Click-to-load map. Until the visitor asks for it, the line-art bridge
 * stands in and nothing loads from Google. Then the Maps embed takes its
 * place and receives focus. Without JavaScript the button stays hidden; the
 * Get directions link beside it still works.
 */
export function MapFacade({ embedUrl, title, button, note }: Props) {
  const [loaded, setLoaded] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (loaded) frameRef.current?.focus();
  }, [loaded]);

  if (loaded) {
    return (
      <iframe
        ref={frameRef}
        className="where__iframe"
        src={embedUrl}
        title={title}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    );
  }

  return (
    <>
      <BridgeLineArt className="where__art" />
      <div className="where__facade js-only">
        <button type="button" className="btn btn--glass glass-blur" data-action="map" onClick={() => setLoaded(true)}>
          <MapIcon size={18} />
          {button}
        </button>
        <p className="where__note">{note}</p>
      </div>
    </>
  );
}
