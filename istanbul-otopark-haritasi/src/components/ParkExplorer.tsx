"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import type { Park } from "@/lib/types";
import ParkCard from "./ParkCard";
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  MapPinIcon,
  MapIcon,
} from "@heroicons/react/24/outline";

const ParkMap = dynamic(() => import("./ParkMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
      Harita yükleniyor…
    </div>
  ),
});

const GoogleTrafficMap = dynamic(() => import("./GoogleTrafficMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
      Trafik haritası yükleniyor…
    </div>
  ),
});

const REFRESH_MS = 60_000;
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

export default function ParkExplorer() {
  const [parks, setParks] = useState<Park[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [focusTarget, setFocusTarget] = useState<Park | null>(null);
  const [trafficMode, setTrafficMode] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/parks", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Bilinmeyen hata");
      setParks(data.parks);
      setUpdatedAt(data.updatedAt);
    } catch {
      setError("Otopark verileri alınamadı. Lütfen daha sonra tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
    const interval = setInterval(load, REFRESH_MS);
    return () => clearInterval(interval);
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    if (!q) return parks;
    return parks.filter(
      (p) =>
        p.name.toLocaleLowerCase("tr").includes(q) ||
        p.district.toLocaleLowerCase("tr").includes(q)
    );
  }, [parks, query]);

  const handleNavigate = (park: Park) => {
    setSelectedId(park.id);
    setFocusTarget(park);
  };

  const selectedPark = parks.find((p) => p.id === selectedId) ?? null;

  return (
    <div className="flex h-dvh w-full flex-col bg-gray-50">
      <header className="flex flex-wrap items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <MapPinIcon className="h-6 w-6 text-blue-600" />
          <h1 className="text-lg font-semibold text-gray-900">İstanbul Otopark Haritası</h1>
        </div>
        <div className="relative ml-auto w-full max-w-xs sm:w-64">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Otopark veya ilçe ara…"
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:bg-white"
          />
        </div>
        {GOOGLE_MAPS_API_KEY && (
          <button
            onClick={() => setTrafficMode((v) => !v)}
            aria-pressed={trafficMode}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
              trafficMode
                ? "border-blue-400 bg-blue-50 text-blue-700"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <MapIcon className="h-4 w-4" />
            Trafik
          </button>
        )}
        <button
          onClick={() => {
            setLoading(true);
            load();
          }}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          <ArrowPathIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Yenile
        </button>
      </header>

      {updatedAt && (
        <div className="border-b border-gray-100 bg-white px-4 py-1.5 text-xs text-gray-400 sm:px-6">
          Son güncelleme: {new Date(updatedAt).toLocaleTimeString("tr-TR")} • {parks.length} otopark
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
        <main className="order-1 h-72 shrink-0 sm:order-2 sm:h-auto sm:flex-1">
          {trafficMode && GOOGLE_MAPS_API_KEY ? (
            <GoogleTrafficMap
              parks={filtered}
              selectedId={selectedId}
              onSelect={(id) => setSelectedId(id)}
              focusTarget={focusTarget}
              apiKey={GOOGLE_MAPS_API_KEY}
            />
          ) : (
            <ParkMap
              parks={filtered}
              selectedId={selectedId}
              onSelect={(id) => setSelectedId(id)}
              focusTarget={focusTarget}
            />
          )}
        </main>

        <aside className="order-2 flex min-h-0 w-full flex-1 flex-col border-t border-gray-200 bg-white sm:order-1 sm:w-96 sm:flex-none sm:border-r sm:border-t-0">
          <div className="flex-1 overflow-y-auto p-3">
            {loading && parks.length === 0 && (
              <p className="p-4 text-center text-sm text-gray-400">Yükleniyor…</p>
            )}
            {error && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>
            )}
            {!loading && !error && filtered.length === 0 && (
              <p className="p-4 text-center text-sm text-gray-400">Sonuç bulunamadı.</p>
            )}
            <div className="flex flex-col gap-2">
              {filtered.map((park) => (
                <ParkCard
                  key={park.id}
                  park={park}
                  active={park.id === selectedId}
                  onNavigate={handleNavigate}
                />
              ))}
            </div>
          </div>
        </aside>
      </div>

      {selectedPark && (
        <div className="border-t border-gray-200 bg-white px-4 py-2 text-xs text-gray-500 sm:hidden">
          Seçili: {selectedPark.name}
        </div>
      )}
    </div>
  );
}
