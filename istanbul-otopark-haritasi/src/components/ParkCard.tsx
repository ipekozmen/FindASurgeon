import type { Park } from "@/lib/types";
import DensityBadge from "./DensityBadge";
import { MapPinIcon, ClockIcon, TruckIcon } from "@heroicons/react/24/outline";

export default function ParkCard({
  park,
  onNavigate,
  active,
}: {
  park: Park;
  onNavigate: (park: Park) => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={() => onNavigate(park)}
      className={`w-full text-left rounded-xl border p-3 transition-colors ${
        active
          ? "border-blue-400 bg-blue-50"
          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900 leading-snug">{park.name}</h3>
        <DensityBadge park={park} />
      </div>

      <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
        <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
        <span>{park.district}</span>
        <span className="text-gray-300">•</span>
        <span>{park.parkType}</span>
      </div>

      <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
        <ClockIcon className="h-3.5 w-3.5 shrink-0" />
        <span>{park.workHours}</span>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <TruckIcon className="h-3.5 w-3.5 shrink-0" />
          <span>
            {park.emptyCapacity} / {park.capacity} boş
          </span>
        </div>
        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-current transition-all"
            style={{
              width: `${Math.round(park.occupancyRate * 100)}%`,
              color:
                park.occupancyRate >= 0.9
                  ? "#ef4444"
                  : park.occupancyRate >= 0.6
                    ? "#f59e0b"
                    : "#10b981",
            }}
          />
        </div>
      </div>
    </button>
  );
}
