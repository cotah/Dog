"use client";

import { GoogleMap, InfoWindow, Marker, useJsApiLoader } from "@react-google-maps/api";
import { Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";

import type { PublicProvider } from "@/types/directory";

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
// Centro de Dublin — usado so como fallback antes do fitBounds.
const DUBLIN = { lat: 53.3498, lng: -6.2603 };

type LocatedProvider = PublicProvider & { latitude: number; longitude: number };

// Mapa interativo do diretorio: um pin por provider COM coordenadas.
// Providers sem lat/lng nao aparecem aqui (continuam na lista). Se a key do
// Google Maps nao estiver configurada, o componente nao renderiza nada.
export function DirectoryMap({ providers }: { providers: PublicProvider[] }) {
  const t = useTranslations("directory");
  const [activeId, setActiveId] = useState<string | null>(null);

  const located = useMemo(
    () =>
      providers.filter(
        (p): p is LocatedProvider =>
          p.latitude != null && p.longitude != null,
      ),
    [providers],
  );

  const { isLoaded } = useJsApiLoader({
    id: "taloa-google-maps",
    googleMapsApiKey: MAPS_KEY,
  });

  // Enquadra todos os pins ao carregar (e limita zoom quando ha so um).
  const onLoad = useCallback(
    (map: google.maps.Map) => {
      if (located.length === 0) return;
      const bounds = new google.maps.LatLngBounds();
      located.forEach((p) =>
        bounds.extend({ lat: p.latitude, lng: p.longitude }),
      );
      map.fitBounds(bounds, 60);
      if (located.length === 1) {
        const listener = google.maps.event.addListener(map, "idle", () => {
          if ((map.getZoom() ?? 0) > 15) map.setZoom(15);
          google.maps.event.removeListener(listener);
        });
      }
    },
    [located],
  );

  // Sem key ou sem nenhum provider geolocalizado: nada de mapa.
  if (!MAPS_KEY || located.length === 0) return null;

  if (!isLoaded) {
    return (
      <div className="flex h-64 items-center justify-center rounded-card bg-white text-sm text-slate-400 shadow-sm">
        {t("map_loading")}
      </div>
    );
  }

  const active = located.find((p) => p.id === activeId) ?? null;

  return (
    <div className="overflow-hidden rounded-card shadow-sm">
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "320px" }}
        center={DUBLIN}
        zoom={12}
        onLoad={onLoad}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        }}
      >
        {located.map((p) => (
          <Marker
            key={p.id}
            position={{ lat: p.latitude, lng: p.longitude }}
            title={p.name}
            onClick={() => setActiveId(p.id)}
          />
        ))}

        {active && (
          <InfoWindow
            position={{ lat: active.latitude, lng: active.longitude }}
            onCloseClick={() => setActiveId(null)}
          >
            <div className="min-w-[160px] max-w-[220px] p-1">
              <p className="font-semibold text-slate-800">{active.name}</p>
              {active.area && (
                <p className="text-xs text-slate-500">{active.area}</p>
              )}
              {active.phone && (
                <>
                  <p className="mt-1 text-sm text-slate-600">{active.phone}</p>
                  <a
                    href={`tel:${active.phone.replace(/\s/g, "")}`}
                    className="mt-2 inline-flex h-9 items-center justify-center gap-1.5 rounded-input bg-taloa-primary px-3 text-sm font-semibold text-white hover:bg-taloa-secondary"
                  >
                    <Phone className="h-4 w-4" /> {t("call_now")}
                  </a>
                </>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}
