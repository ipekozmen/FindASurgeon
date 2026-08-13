import type { Park } from "@/lib/types";
import { getDensityLevel } from "@/lib/types";

const STYLES: Record<string, { label: string; className: string }> = {
  low: { label: "Boş", className: "bg-emerald-100 text-emerald-700 border border-emerald-200" },
  medium: { label: "Orta", className: "bg-amber-100 text-amber-700 border border-amber-200" },
  high: { label: "Yoğun", className: "bg-orange-100 text-orange-700 border border-orange-200" },
  full: { label: "Dolu", className: "bg-red-100 text-red-700 border border-red-200" },
  unknown: { label: "Bilinmiyor", className: "bg-gray-100 text-gray-500 border border-gray-200" },
};

export default function DensityBadge({ park }: { park: Park }) {
  const level = getDensityLevel(park);
  const style = STYLES[level];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style.className}`}>
      {style.label}
    </span>
  );
}

export function densityColor(park: Park): string {
  const level = getDensityLevel(park);
  switch (level) {
    case "low":
      return "#10b981";
    case "medium":
      return "#f59e0b";
    case "high":
      return "#f97316";
    case "full":
      return "#ef4444";
    default:
      return "#9ca3af";
  }
}
