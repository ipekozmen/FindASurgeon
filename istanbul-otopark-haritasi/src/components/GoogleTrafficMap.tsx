"use client";

import { useEffect, useRef } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import type { Park } from "@/lib/types";
import { densityColor } from "./DensityBadge";

const ISTANBUL_CENTER = { lat: 41.0082, lng: 28.9784 };

export default function GoogleTrafficMap({
  parks,
  selectedId,
  onSelect,
  focusTarget,
  apiKey,
}: {
  parks: Park[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  focusTarget: Park | null;
  apiKey: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<number, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const readyRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;

    setOptions({ key: apiKey, v: "weekly" });

    (async () => {
      const { Map } = await importLibrary("maps");
      await importLibrary("marker");
      if (cancelled || !containerRef.current) return;

      const map = new Map(containerRef.current, {
        center: ISTANBUL_CENTER,
        zoom: 11,
        mapId: "ISTANBUL_OTOPARK_TRAFFIC",
      });

      const trafficLayer = new google.maps.TrafficLayer();
      trafficLayer.setMap(map);

      mapRef.current = map;
      readyRef.current = true;
    })();

    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;

    const existingIds = new Set(markersRef.current.keys());
    const nextIds = new Set(parks.map((p) => p.id));

    for (const id of existingIds) {
      if (!nextIds.has(id)) {
        markersRef.current.get(id)!.map = null;
        markersRef.current.delete(id);
      }
    }

    for (const park of parks) {
      const isSelected = park.id === selectedId;
      const color = densityColor(park);
      const existing = markersRef.current.get(park.id);

      const pin = new google.maps.marker.PinElement({
        background: color,
        borderColor: isSelected ? "#1d4ed8" : "#ffffff",
        glyphColor: "#ffffff",
        scale: isSelected ? 1.15 : 0.85,
      });

      if (existing) {
        existing.content = pin.element;
      } else {
        const marker = new google.maps.marker.AdvancedMarkerElement({
          map,
          position: { lat: park.lat, lng: park.lng },
          content: pin.element,
          title: `${park.name} (${park.emptyCapacity}/${park.capacity} boş)`,
        });
        marker.addListener("click", () => onSelect(park.id));
        markersRef.current.set(park.id, marker);
      }
    }
  }, [parks, selectedId, onSelect]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current || !focusTarget) return;
    map.panTo({ lat: focusTarget.lat, lng: focusTarget.lng });
    map.setZoom(16);
  }, [focusTarget]);

  return <div ref={containerRef} className="h-full w-full" />;
}
