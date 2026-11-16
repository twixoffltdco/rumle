"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PlayerState, Weather, Mission, GameTime, Gender } from "../types/game";

interface GameStore {
  player: PlayerState;
  setPlayerPos: (pos: [number, number, number], rotY?: number, speed?: number) => void;
  setHealth: (v: number) => void;
  setStamina: (v: number) => void;
  addMoney: (amount: number) => void;
  setWanted: (level: number) => void;
  increaseWanted: (by?: number) => void;
  decreaseWanted: () => void;
  setGender: (g: Gender) => void;
  setInVehicle: (id: string | null) => void;

  time: GameTime;
  weather: Weather;
  tickTime: (dt: number) => void;
  setWeather: (w: Weather) => void;

  phoneOpen: boolean;
  mapOpen: boolean;
  togglePhone: () => void;
  setPhoneOpen: (v: boolean) => void;

  missions: Mission[];
  activeMissionId: string | null;
  startMission: (id: string) => void;
  completeMission: (id: string) => void;
  checkMissionProximity: (pos: [number, number, number]) => void;

  quality: "low" | "medium" | "high";
  setQuality: (q: "low" | "medium" | "high") => void;

  isOnline: boolean;
  peerId: string | null;
  setOnline: (v: boolean, peerId?: string | null) => void;

  lastCrimeAt: number;
  reportCrime: (severity: number) => void;
  tickWanted: (dt: number) => void;

  resetPlayer: () => void;
}

const defaultPlayer: PlayerState = {
  health: 100,
  stamina: 100,
  money: 5000,
  wantedLevel: 0,
  gender: "male",
  inVehicleId: null,
  position: [0, 0, 8],
  rotationY: 0,
  speed: 0,
};

const defaultMissions: Mission[] = [
  {
    id: "m1",
    title: "Первый заказ",
    description: "Доберись до главной площади (монумент) и отметься у информатора.",
    type: "delivery",
    status: "available",
    reward: 2000,
    objectives: ["Добраться до монумента на севере центра"],
    targetPos: [0, 0, -55],
    targetRadius: 18,
  },
  {
    id: "m2",
    title: "Набережная",
    description: "Доехать до набережной на юге города.",
    type: "side",
    status: "available",
    reward: 1500,
    objectives: ["Достичь набережной"],
    targetPos: [0, 0, 90],
    targetRadius: 25,
  },
  {
    id: "m3",
    title: "Промзона",
    description: "Проверь восточную промышленную зону.",
    type: "side",
    status: "available",
    reward: 2500,
    objectives: ["Добраться до промзоны"],
    targetPos: [90, 0, 0],
    targetRadius: 22,
  },
];

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      player: { ...defaultPlayer },
      setPlayerPos: (pos, rotY, speed) =>
        set((s) => ({
          player: {
            ...s.player,
            position: pos,
            rotationY: rotY ?? s.player.rotationY,
            speed: speed ?? s.player.speed,
          },
        })),
      setHealth: (v) => set((s) => ({ player: { ...s.player, health: Math.max(0, Math.min(100, v)) } })),
      setStamina: (v) => set((s) => ({ player: { ...s.player, stamina: Math.max(0, Math.min(100, v)) } })),
      addMoney: (amount) => set((s) => ({ player: { ...s.player, money: Math.max(0, s.player.money + amount) } })),
      setWanted: (level) => set((s) => ({ player: { ...s.player, wantedLevel: Math.max(0, Math.min(5, level)) } })),
      increaseWanted: (by = 1) =>
        set((s) => ({
          player: { ...s.player, wantedLevel: Math.min(5, s.player.wantedLevel + by) },
          lastCrimeAt: Date.now(),
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
        let mins = s.time.minutes + dt * 0.9;
        let hours = s.time.hours;
        if (mins >= 60) {
          mins -= 60;
          hours = (hours + 1) % 24;
        }
        set({ time: { hours, minutes: Math.floor(mins), dayProgress: (hours + mins / 60) / 24 } });
      },
      setWeather: (w) => set({ weather: w }),

      phoneOpen: false,
      mapOpen: false,
      togglePhone: () => set((s) => ({ phoneOpen: !s.phoneOpen })),
      setPhoneOpen: (v) => set({ phoneOpen: v }),

      missions: defaultMissions,
      activeMissionId: null,
      startMission: (id) =>
        set((s) => ({
          activeMissionId: id,
          missions: s.missions.map((m) => (m.id === id ? { ...m, status: "active" as const } : m)),
        })),
      completeMission: (id) =>
        set((s) => {
          const m = s.missions.find((x) => x.id === id);
          if (!m || m.status !== "active") return {};
          return {
            activeMissionId: null,
            missions: s.missions.map((x) => (x.id === id ? { ...x, status: "completed" as const } : x)),
            player: { ...s.player, money: s.player.money + m.reward },
          };
        }),
      checkMissionProximity: (pos) => {
        const s = get();
        if (!s.activeMissionId) return;
        const m = s.missions.find((x) => x.id === s.activeMissionId);
        if (!m || m.status !== "active" || !m.targetPos) return;
        const dx = pos[0] - m.targetPos[0];
        const dz = pos[2] - m.targetPos[2];
        const r = m.targetRadius ?? 15;
        if (dx * dx + dz * dz < r * r) {
          get().completeMission(m.id);
        }
      },

      quality: "medium",
      setQuality: (q) => set({ quality: q }),

      isOnline: false,
      peerId: null,
      setOnline: (v, peerId = null) => set({ isOnline: v, peerId }),

      lastCrimeAt: 0,
      reportCrime: (severity) => {
        get().increaseWanted(severity);
      },
      tickWanted: (dt) => {
        const s = get();
        if (s.player.wantedLevel <= 0) return;
        // Decay if no recent crime (~25s calm)
        if (Date.now() - s.lastCrimeAt > 25000) {
          // accumulate decay
          const acc = (s as unknown as { _wantedAcc?: number })._wantedAcc ?? 0;
          const next = acc + dt;
          if (next > 12) {
            get().decreaseWanted();
            (s as unknown as { _wantedAcc?: number })._wantedAcc = 0;
          } else {
            (s as unknown as { _wantedAcc?: number })._wantedAcc = next;
          }
        }
      },

      resetPlayer: () =>
        set({
          player: { ...defaultPlayer },
          activeMissionId: null,
          missions: defaultMissions.map((m) => ({ ...m, status: "available" as const })),
        }),
    }),
    {
      name: "rumle-save-v05",
      partialize: (s) => ({
        player: { ...s.player, inVehicleId: null, speed: 0 },
        missions: s.missions,
        quality: s.quality,
      }),
    }
  )
);
