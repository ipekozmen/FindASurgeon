"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Park } from "@/lib/types";
import { densityColor } from "./DensityBadge";

const ISTANBUL_CENTER: [number, number] = [41.0082, 28.9784];

export default function ParkMap({
  parks,
  selectedId,
  onSelect,
  focusTarget,
}: {
  parks: Park[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  focusTarget: Park | null;
}) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<Map<number, L.CircleMarker>>(new Map());

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: ISTANBUL_CENTER,
      zoom: 11,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const existingIds = new Set(markersRef.current.keys());
    const nextIds = new Set(parks.map((p) => p.id));

    for (const id of existingIds) {
      if (!nextIds.has(id)) {
        markersRef.current.get(id)?.remove();
        markersRef.current.delete(id);
      }
    }

    for (const park of parks) {
      const color = densityColor(park);
      const isSelected = park.id === selectedId;
      const existing = markersRef.current.get(park.id);

      if (existing) {
        existing.setStyle({
          color: isSelected ? "#1d4ed8" : color,
          fillColor: color,
          weight: isSelected ? 3 : 1,
          radius: isSelected ? 9 : 6,
        });
      } else {
        const marker = L.circleMarker([park.lat, park.lng], {
          radius: isSelected ? 9 : 6,
          color: isSelected ? "#1d4ed8" : color,
          weight: isSelected ? 3 : 1,
          fillColor: color,
          fillOpacity: 0.85,
        }).addTo(map);

        marker.bindTooltip(
          `<strong>${park.name}</strong><br/>${park.emptyCapacity}/${park.capacity} boş`
        );
        marker.on("click", () => onSelect(park.id));
        markersRef.current.set(park.id, marker);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parks, selectedId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusTarget) return;
    map.flyTo([focusTarget.lat, focusTarget.lng], 16, { duration: 0.8 });
  }, [focusTarget]);

  return <div ref={containerRef} className="h-full w-full" />;
}
