export type Gender = "male" | "female";
export type Weather = "clear" | "cloudy" | "rain" | "storm" | "fog";
export type VehicleClass = "sedan" | "suv" | "sport" | "super" | "moto" | "truck" | "bus" | "police" | "special";

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

export interface NPC {
  id: string;
  position: [number, number, number];
  rotationY: number;
  state: "walk" | "idle" | "flee" | "call_police" | "talk" | "enter_vehicle";
  gender: Gender;
  color: string;
  speed: number;
  target?: [number, number, number];
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  type: "story" | "side" | "race" | "delivery" | "heist";
  status: "available" | "active" | "completed" | "failed";
  reward: number;
  objectives: string[];
  /** Simple world target for distance checks */
  targetPos?: [number, number, number];
  targetRadius?: number;
}

export interface GameTime {
  hours: number;
  minutes: number;
  dayProgress: number;
}
