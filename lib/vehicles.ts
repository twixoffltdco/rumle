import type { VehicleDef } from "./types/game";

export const VEHICLE_CATALOG: VehicleDef[] = [
  { id: "vostok-sedan", brand: "Vostok", model: "Cityline", class: "sedan", color: "#2a5a8a", maxSpeed: 160, acceleration: 0.7, handling: 0.75, seats: 4, price: 18000 },
  { id: "aura-suv", brand: "Aura", model: "Trailmaster", class: "suv", color: "#4a6a4a", maxSpeed: 150, acceleration: 0.65, handling: 0.7, seats: 5, price: 32000 },
  { id: "volgax-classic", brand: "VolgaX", model: "Legacy", class: "sedan", color: "#8a6a2a", maxSpeed: 140, acceleration: 0.55, handling: 0.65, seats: 4, price: 12000 },
  { id: "raiser-sport", brand: "Raiser", model: "GT-X", class: "sport", color: "#8a2a2a", maxSpeed: 220, acceleration: 0.95, handling: 0.9, seats: 2, price: 85000 },
  { id: "nord-super", brand: "Nord", model: "Apex", class: "super", color: "#1a1a2a", maxSpeed: 280, acceleration: 1.1, handling: 0.95, seats: 2, price: 220000 },
  { id: "vector-moto", brand: "Vector", model: "Street", class: "moto", color: "#cc4422", maxSpeed: 200, acceleration: 1.0, handling: 0.85, seats: 2, price: 9500 },
  { id: "orion-truck", brand: "Orion", model: "Hauler", class: "truck", color: "#5a5a5a", maxSpeed: 120, acceleration: 0.4, handling: 0.5, seats: 2, price: 45000 },
  { id: "kresta-bus", brand: "Kresta", model: "Metro", class: "bus", color: "#3a5a8a", maxSpeed: 100, acceleration: 0.3, handling: 0.4, seats: 20, price: 90000 },
  { id: "vostok-police", brand: "Vostok", model: "Patrol", class: "police", color: "#e8e8e8", maxSpeed: 180, acceleration: 0.85, handling: 0.8, seats: 4, price: 0, isPolice: true },
  { id: "aura-police-suv", brand: "Aura", model: "Enforcer", class: "police", color: "#e8e8e8", maxSpeed: 170, acceleration: 0.8, handling: 0.75, seats: 5, price: 0, isPolice: true },
];

export function getVehicleDef(id: string): VehicleDef | undefined {
  return VEHICLE_CATALOG.find((v) => v.id === id);
}

export function randomCivilianVehicle(): VehicleDef {
  const civ = VEHICLE_CATALOG.filter((v) => !v.isPolice && v.class !== "bus" && v.class !== "truck");
  return civ[Math.floor(Math.random() * civ.length)];
}
