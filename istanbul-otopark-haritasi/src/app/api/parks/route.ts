import { NextResponse } from "next/server";
import type { Park, RawPark } from "@/lib/types";

const ISPARK_URL = "https://api.ibb.gov.tr/ispark/Park";

export async function GET() {
  try {
    const res = await fetch(ISPARK_URL, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "İSPARK verisi alınamadı" },
        { status: 502 }
      );
    }

    const raw: RawPark[] = await res.json();

    const parks: Park[] = raw
      .map((p) => {
        const lat = parseFloat(p.lat);
        const lng = parseFloat(p.lng);
        const capacity = Number(p.capacity) || 0;
        const emptyCapacity = Math.max(0, Number(p.emptyCapacity) || 0);
        const occupancyRate =
          capacity > 0 ? Math.min(1, Math.max(0, (capacity - emptyCapacity) / capacity)) : 0;

        return {
          id: p.parkID,
          name: p.parkName?.trim() || "İsimsiz Otopark",
          lat,
          lng,
          capacity,
          emptyCapacity,
          occupancyRate,
          workHours: p.workHours || "-",
          parkType: p.parkType || "-",
          freeTime: p.freeTime ?? 0,
          district: p.district || "-",
          isOpen: p.isOpen === 1,
        };
      })
      .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));

    return NextResponse.json({ parks, updatedAt: new Date().toISOString() });
  } catch {
    return NextResponse.json(
      { error: "İSPARK verisine ulaşılamadı" },
      { status: 500 }
    );
  }
}
