"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PlayerState, Weather, Mission, GameTime, Gender, OutfitId, PoliceMemory } from "../types/game";

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
  toggleMask: () => void;
  setOutfit: (o: OutfitId) => void;

  policeMemory: PoliceMemory;
  /** Call when police "see" the player during high wanted */
  recordSuspect: () => void;
  /** Returns true if current look matches what police remember */
  isRecognized: () => boolean;
  clearPoliceMemory: () => void;

  time: GameTime;
  weather: Weather;
  tickTime: (dt: number) => void;
  setWeather: (w: Weather) => void;

  phoneOpen: boolean;
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

  prologueDone: boolean;
  setPrologueDone: (v: boolean) => void;

  nearShopId: string | null;
  setNearShop: (id: string | null) => void;
  buyOutfit: (outfit: OutfitId, price: number) => boolean;

  resetPlayer: () => void;
}

const defaultPlayer: PlayerState = {
  health: 100,
  stamina: 100,
  money: 5000,
  wantedLevel: 0,
  gender: "male",
  inVehicleId: null,
  position: [0, 0, 12],
  rotationY: 0,
  speed: 0,
  maskOn: false,
  outfit: "street",
};

const defaultMemory: PoliceMemory = {
  active: false,
  sawMask: false,
  outfit: null,
  recordedAt: 0,
};

const defaultMissions: Mission[] = [
  {
    id: "m1",
    title: "К стенам Цитадели",
    description: "Доберись до главной площади у Новоградской цитадели.",
    type: "story",
    status: "available",
    reward: 2500,
    objectives: ["Дойти до Цитадели (север центра)"],
    targetPos: [0, 0, -58],
    targetRadius: 22,
  },
  {
    id: "m2",
    title: "Сменить облик",
    description: "Зайди в любой магазин одежды (метка «ОДЕЖДА») и смени комплект.",
    type: "side",
    status: "available",
    reward: 1200,
    objectives: ["Сменить одежду в магазине"],
    targetPos: [18, 0, 8],
    targetRadius: 8,
  },
  {
    id: "m3",
    title: "Набережная",
    description: "Доехать до южной набережной.",
    type: "side",
    status: "available",
    reward: 1500,
    objectives: ["Достичь набережной"],
    targetPos: [0, 0, 90],
    targetRadius: 25,
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
      increaseWanted: (by = 1) => {
        set((s) => ({
          player: { ...s.player, wantedLevel: Math.min(5, s.player.wantedLevel + by) },
          lastCrimeAt: Date.now(),
        }));
        // Police record look when crime escalates
        if (get().player.wantedLevel >= 1) get().recordSuspect();
      },
      decreaseWanted: () =>
        set((s) => ({
          player: { ...s.player, wantedLevel: Math.max(0, s.player.wantedLevel - 1) },
        })),
      setGender: (g) => set((s) => ({ player: { ...s.player, gender: g } })),
      setInVehicle: (id) => set((s) => ({ player: { ...s.player, inVehicleId: id } })),
      toggleMask: () => set((s) => ({ player: { ...s.player, maskOn: !s.player.maskOn } })),
      setOutfit: (o) => set((s) => ({ player: { ...s.player, outfit: o } })),

      policeMemory: { ...defaultMemory },
      recordSuspect: () => {
        const p = get().player;
        set({
          policeMemory: {
            active: true,
            sawMask: p.maskOn,
            outfit: p.outfit,
            recordedAt: Date.now(),
          },
        });
      },
      isRecognized: () => {
        const mem = get().policeMemory;
        const p = get().player;
        if (!mem.active || p.wantedLevel <= 0) return false;
        // Mask on now but they saw without mask (or vice versa) → harder to match
        if (mem.sawMask !== p.maskOn) return false;
        // Different outfit → not recognized
        if (mem.outfit && mem.outfit !== p.outfit) return false;
        return true;
      },
      clearPoliceMemory: () => set({ policeMemory: { ...defaultMemory } }),

      time: { hours: 22, minutes: 10, dayProgress: 0.92 },
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
        // Special: clothing mission completes on outfit change near shop — handled in buyOutfit
        if (m.id === "m2") return;
        const dx = pos[0] - m.targetPos[0];
        const dz = pos[2] - m.targetPos[2];
        const r = m.targetRadius ?? 15;
        if (dx * dx + dz * dz < r * r) get().completeMission(m.id);
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
        const recognized = get().isRecognized();
        // If not recognized (changed mask/outfit), decay much faster
        const calmMs = recognized ? 28000 : 10000;
        if (Date.now() - s.lastCrimeAt > calmMs) {
          const key = "_wantedAcc" as const;
          const acc = ((s as unknown as Record<string, number>)[key] ?? 0) + dt;
          if (acc > (recognized ? 14 : 6)) {
            get().decreaseWanted();
            if (get().player.wantedLevel === 0) get().clearPoliceMemory();
            (s as unknown as Record<string, number>)[key] = 0;
          } else {
            (s as unknown as Record<string, number>)[key] = acc;
          }
        }
      },

      prologueDone: false,
      setPrologueDone: (v) => set({ prologueDone: v }),

      nearShopId: null,
      setNearShop: (id) => set({ nearShopId: id }),
      buyOutfit: (outfit, price) => {
        const s = get();
        if (s.player.money < price) return false;
        if (s.player.outfit === outfit) return false;
        set({
          player: {
            ...s.player,
            money: s.player.money - price,
            outfit,
          },
        });
        // Changing clothes breaks recognition → help lose heat
        if (s.policeMemory.active && s.policeMemory.outfit !== outfit) {
          if (s.player.wantedLevel > 0) {
            set((st) => ({
              player: { ...st.player, wantedLevel: Math.max(0, st.player.wantedLevel - 2) },
            }));
          }
        }
        if (s.activeMissionId === "m2") get().completeMission("m2");
        return true;
      },

      resetPlayer: () =>
        set({
          player: { ...defaultPlayer },
          policeMemory: { ...defaultMemory },
          activeMissionId: null,
          missions: defaultMissions.map((m) => ({ ...m, status: "available" as const })),
          prologueDone: false,
        }),
    }),
    {
      name: "rumle-save-v07",
      partialize: (s) => ({
        player: { ...s.player, inVehicleId: null, speed: 0 },
        missions: s.missions,
        quality: s.quality,
        prologueDone: s.prologueDone,
        policeMemory: s.policeMemory,
      }),
    }
  )
);
