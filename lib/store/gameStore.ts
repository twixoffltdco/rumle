"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PlayerState, Weather, Mission, GameTime, Gender } from "../types/game";

interface GameStore {
  // Player
  player: PlayerState;
  setPlayerPos: (pos: [number, number, number], rotY?: number) => void;
  setHealth: (v: number) => void;
  setStamina: (v: number) => void;
  addMoney: (amount: number) => void;
  setWanted: (level: number) => void;
  increaseWanted: (by?: number) => void;
  decreaseWanted: () => void;
  setGender: (g: Gender) => void;
  setInVehicle: (id: string | null) => void;

  // World
  time: GameTime;
  weather: Weather;
  tickTime: (dt: number) => void;
  setWeather: (w: Weather) => void;

  // UI
  phoneOpen: boolean;
  mapOpen: boolean;
  inventoryOpen: boolean;
  togglePhone: () => void;
  toggleMap: () => void;
  setPhoneOpen: (v: boolean) => void;

  // Missions
  missions: Mission[];
  activeMissionId: string | null;
  startMission: (id: string) => void;
  completeMission: (id: string) => void;

  // Settings
  quality: "low" | "medium" | "high";
  setQuality: (q: "low" | "medium" | "high") => void;

  // Online
  isOnline: boolean;
  peerId: string | null;
  setOnline: (v: boolean, peerId?: string | null) => void;

  // Reset
  resetPlayer: () => void;
}

const defaultPlayer: PlayerState = {
  health: 100,
  stamina: 100,
  money: 2500,
  wantedLevel: 0,
  gender: "male",
  inVehicleId: null,
  position: [0, 0, 8],
  rotationY: 0,
};

const defaultMissions: Mission[] = [
  {
    id: "m1",
    title: "Первый заказ",
    description: "Забери пакет у информатора на площади и доставь в промышленную зону.",
    type: "delivery",
    status: "available",
    reward: 1500,
    objectives: ["Найти информатора", "Забрать пакет", "Доставить в промзону"],
  },
  {
    id: "m2",
    title: "Ночная гонка",
    description: "Выиграй уличную гонку на набережной.",
    type: "race",
    status: "available",
    reward: 3000,
    objectives: ["Добраться до старта", "Победить в гонке"],
  },
  {
    id: "m3",
    title: "Тихий визит",
    description: "Навести порядок в одном из клубов. Решай сам — силой или переговорами.",
    type: "side",
    status: "available",
    reward: 2200,
    objectives: ["Найти клуб", "Разобраться с ситуацией"],
  },
];

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      player: { ...defaultPlayer },
      setPlayerPos: (pos, rotY) =>
        set((s) => ({
          player: {
            ...s.player,
            position: pos,
            rotationY: rotY ?? s.player.rotationY,
          },
        })),
      setHealth: (v) => set((s) => ({ player: { ...s.player, health: Math.max(0, Math.min(100, v)) } })),
      setStamina: (v) => set((s) => ({ player: { ...s.player, stamina: Math.max(0, Math.min(100, v)) } })),
      addMoney: (amount) => set((s) => ({ player: { ...s.player, money: Math.max(0, s.player.money + amount) } })),
      setWanted: (level) => set((s) => ({ player: { ...s.player, wantedLevel: Math.max(0, Math.min(5, level)) } })),
      increaseWanted: (by = 1) =>
        set((s) => ({
          player: { ...s.player, wantedLevel: Math.min(5, s.player.wantedLevel + by) },
        })),
      decreaseWanted: () =>
        set((s) => ({
          player: { ...s.player, wantedLevel: Math.max(0, s.player.wantedLevel - 1) },
        })),
      setGender: (g) => set((s) => ({ player: { ...s.player, gender: g } })),
      setInVehicle: (id) => set((s) => ({ player: { ...s.player, inVehicleId: id } })),

      time: { hours: 14, minutes: 30, dayProgress: 0.6 },
      weather: "clear",
      tickTime: (dt) => {
        const s = get();
        let mins = s.time.minutes + dt * 0.8; // accelerated time
        let hours = s.time.hours;
        if (mins >= 60) {
          mins -= 60;
          hours = (hours + 1) % 24;
        }
        const dayProgress = (hours + mins / 60) / 24;
        set({ time: { hours, minutes: Math.floor(mins), dayProgress } });
      },
      setWeather: (w) => set({ weather: w }),

      phoneOpen: false,
      mapOpen: false,
      inventoryOpen: false,
      togglePhone: () => set((s) => ({ phoneOpen: !s.phoneOpen })),
      toggleMap: () => set((s) => ({ mapOpen: !s.mapOpen })),
      setPhoneOpen: (v) => set({ phoneOpen: v }),

      missions: defaultMissions,
      activeMissionId: null,
      startMission: (id) =>
        set((s) => ({
          activeMissionId: id,
          missions: s.missions.map((m) => (m.id === id ? { ...m, status: "active" } : m)),
        })),
      completeMission: (id) =>
        set((s) => {
          const m = s.missions.find((x) => x.id === id);
          if (m && m.status === "active") {
            return {
              activeMissionId: null,
              missions: s.missions.map((x) => (x.id === id ? { ...x, status: "completed" } : x)),
              player: { ...s.player, money: s.player.money + m.reward },
            };
          }
          return {};
        }),

      quality: "medium",
      setQuality: (q) => set({ quality: q }),

      isOnline: false,
      peerId: null,
      setOnline: (v, peerId = null) => set({ isOnline: v, peerId }),

      resetPlayer: () => set({ player: { ...defaultPlayer } }),
    }),
    {
      name: "rumle-save-v04",
      partialize: (s) => ({
        player: s.player,
        missions: s.missions,
        quality: s.quality,
      }),
    }
  )
);
