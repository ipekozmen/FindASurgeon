export interface RawPark {
  parkID: number;
  parkName: string;
  lat: string;
  lng: string;
  capacity: number;
  emptyCapacity: number;
  workHours: string;
  parkType: string;
  freeTime: number;
  district: string;
  isOpen: number;
}

export interface Park {
  id: number;
  name: string;
  lat: number;
  lng: number;
  capacity: number;
  emptyCapacity: number;
  occupancyRate: number;
  workHours: string;
  parkType: string;
  freeTime: number;
  district: string;
  isOpen: boolean;
}

export type DensityLevel = "low" | "medium" | "high" | "full" | "unknown";

export function getDensityLevel(park: Park): DensityLevel {
  if (park.capacity <= 0) return "unknown";
  if (park.emptyCapacity <= 0) return "full";
  const rate = park.occupancyRate;
  if (rate < 0.6) return "low";
  if (rate < 0.9) return "medium";
  return "high";
}
