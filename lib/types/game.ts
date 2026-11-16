export type Gender = "male" | "female";
export type Weather = "clear" | "cloudy" | "rain" | "storm" | "fog";
export type VehicleClass = "sedan" | "suv" | "sport" | "super" | "moto" | "truck" | "bus" | "police" | "special";
export type OutfitId = "street" | "formal" | "sport" | "work";

export interface PlayerState {
  health: number;
  stamina: number;
  money: number;
  wantedLevel: number;
  gender: Gender;
  inVehicleId: string | null;
  position: [number, number, number];
  rotationY: number;
  speed: number;
  /** Mask hides face from police memory */
  maskOn: boolean;
  outfit: OutfitId;
}

/** What police last "recorded" about the suspect */
export interface PoliceMemory {
  active: boolean;
  sawMask: boolean;
  outfit: OutfitId | null;
  recordedAt: number;
}

export interface VehicleDef {
  id: string;
  brand: string;
  model: string;
  class: VehicleClass;
  color: string;
  maxSpeed: number;
  acceleration: number;
  handling: number;
  seats: number;
  price: number;
  isPolice?: boolean;
}

export interface WorldVehicle {
  id: string;
  defId: string;
  position: [number, number, number];
  rotationY: number;
  velocity: number;
  damaged: number;
  locked: boolean;
  ownerId?: string;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  type: "story" | "side" | "race" | "delivery" | "heist";
  status: "available" | "active" | "completed" | "failed";
  reward: number;
  objectives: string[];
  targetPos?: [number, number, number];
  targetRadius?: number;
}

export interface GameTime {
  hours: number;
  minutes: number;
  dayProgress: number;
}

export interface ClothingShop {
  id: string;
  name: string;
  position: [number, number, number];
  radius: number;
}
