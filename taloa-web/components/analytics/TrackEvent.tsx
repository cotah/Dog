"use client";

import { useEffect, useRef } from "react";

import { track, type AnalyticsEvent } from "@/lib/analytics";

// Dispara UM evento ao montar. Usado por paginas server-rendered que precisam
// registar uma visualizacao (ex.: tag_scanned, pricing_page_viewed).
export function TrackEvent({
  event,
  props,
}: {
  event: AnalyticsEvent;
  props?: Record<string, unknown>;
}) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    track(event, props);
    // props vem como literal do server; o ref garante disparo unico.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
