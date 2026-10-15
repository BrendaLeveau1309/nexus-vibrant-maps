import { useEffect, useRef, useState } from "react";
import { Crosshair, MapPin, Minus, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    initNexoVitalMap?: () => void;
    google?: {
      maps: {
        Map: new (node: HTMLElement, options: Record<string, unknown>) => GoogleMapLike;
        Marker: new (options: Record<string, unknown>) => { addListener: (event: string, handler: () => void) => void };
      };
    };
  }
}

type GoogleMapLike = {
  setCenter: (center: { lat: number; lng: number }) => void;
  setZoom: (zoom: number) => void;
  getZoom: () => number | undefined;
};

const locations = [
  { name: "Hospital Nacional Dos de Mayo", type: "Hospital", hours: "Lun–vie, 8:00–17:00", position: { lat: -12.0569, lng: -77.0154 } },
  { name: "Banco de Sangre Rebagliati", type: "Banco de sangre", hours: "Lun–sáb, 7:00–16:00", position: { lat: -12.0786, lng: -77.0407 } },
  { name: "Hemobús NexoVital", type: "Unidad móvil", hours: "Lun–vie, 9:00–15:00", position: { lat: -12.087, lng: -77.033 } },
];

export function FullScreenMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<GoogleMapLike | null>(null);
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<(typeof locations)[number] | null>(null);
  const [mapUnavailable, setMapUnavailable] = useState(false);
  const userPosition = { lat: -12.071, lng: -77.037 };

  useEffect(() => {
    let cancelled = false;
    const initialize = () => {
      if (cancelled || !containerRef.current || !window.google) return;
      const map = new window.google.maps.Map(containerRef.current, {
        center: userPosition,
        zoom: 13,
        disableDefaultUI: true,
        clickableIcons: false,
        gestureHandling: "greedy",
        styles: [
          { featureType: "poi", stylers: [{ visibility: "off" }] },
          { featureType: "transit", stylers: [{ visibility: "off" }] },
        ],
      });
      mapRef.current = map;
      new window.google.maps.Marker({ map, position: userPosition, title: "Tu ubicación", icon: { path: 0, scale: 8, fillColor: "#bb2441", fillOpacity: 1, strokeColor: "#ffffff", strokeWeight: 3 } });
      const Marker = window.google.maps.Marker;
      locations.forEach((location) => {
        const marker = new Marker({ map, position: location.position, title: location.name });
        marker.addListener("click", () => setSelected(location));
      });
      setReady(true);
    };

    if (window.google?.maps) initialize();
    else {
      window.initNexoVitalMap = initialize;
      const key = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"];
      const channel = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID"];
      if (!key) { setMapUnavailable(true); return; }
      const existing = document.querySelector('script[data-nexovital-map="true"]');
      if (!existing) {
        const script = document.createElement("script");
        script.dataset["nexovitalMap"] = "true";
        script.async = true;
        script.onerror = () => setMapUnavailable(true);
        script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&loading=async&callback=initNexoVitalMap&channel=${encodeURIComponent(channel ?? "nexovital")}`;
        document.head.appendChild(script);
      }
    }
    return () => {
      cancelled = true;
      delete window.initNexoVitalMap;
    };
  }, []);

  const zoom = (delta: number) => {
    const map = mapRef.current;
    if (!map) return;
    map.setZoom(Math.min(19, Math.max(3, (map.getZoom() ?? 13) + delta)));
  };

  return (
    <div className="absolute inset-0 bg-map-fallback" aria-label="Mapa interactivo de centros de donación">
      <div ref={containerRef} className="h-full w-full" />
      {!ready && (
        <div className="absolute inset-0 grid place-items-center bg-map-fallback">
          <div className="flex items-center gap-2 rounded-full bg-surface/90 px-4 py-2 text-sm font-semibold text-foreground shadow-panel">
            <MapPin className="text-primary" /> {mapUnavailable ? "Mapa no disponible en esta vista" : "Preparando mapa…"}
          </div>
        </div>
      )}
      <div className="absolute left-4 right-16 top-36 z-10 flex flex-wrap gap-1.5">
        {locations.map(location => <Button key={location.name} size="sm" variant="floating" className="h-auto min-h-8 max-w-full whitespace-normal px-2 py-1 text-left text-xs" onClick={() => { setSelected(location); mapRef.current?.setCenter(location.position); }}><MapPin className="size-3" />{location.type === "Unidad móvil" ? "Hemobús" : location.name.replace("Hospital Nacional ", "Hospital ").replace("Banco de Sangre ", "Banco ")}</Button>)}
      </div>
      {selected && <section className="glass-panel absolute inset-x-4 top-56 z-20 rounded-lg border p-4" aria-live="polite"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase text-primary">{selected.type}</p><h2 className="font-black">{selected.name}</h2></div><Button size="icon" variant="ghost" aria-label="Cerrar información" onClick={() => setSelected(null)}><X /></Button></div><p className="mt-2 flex items-center gap-2 text-sm"><MapPin className="size-4 text-primary" />Horario de ejemplo: {selected.hours}</p></section>}
      <div className="absolute right-4 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-2">
        <Button aria-label="Acercar mapa" title="Acercar" size="icon" variant="floating" onClick={() => zoom(1)}><Plus /></Button>
        <Button aria-label="Alejar mapa" title="Alejar" size="icon" variant="floating" onClick={() => zoom(-1)}><Minus /></Button>
        <Button aria-label="Centrar en mi ubicación" title="Mi ubicación" size="icon" variant="floating" onClick={() => mapRef.current?.setCenter(userPosition)}><Crosshair /></Button>
      </div>
    </div>
  );
}
