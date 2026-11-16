"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sky, Stars } from "@react-three/drei";
import { useEffect, useRef, useMemo } from "react";
import * as THREE from "three";
import { useGameStore } from "@/lib/store/gameStore";
import { VEHICLE_CATALOG, getVehicleDef, randomCivilianVehicle } from "@/lib/vehicles";
import type { WorldVehicle } from "@/lib/types/game";

function rand(a: number, b: number) {
  return a + Math.random() * (b - a);
}

const vehicleRegistry = {
  list: [] as WorldVehicle[],
  meshes: new Map<string, THREE.Group>(),
};

/** Building with emissive window grid — looks like city night, not a cube */
function FancyBuilding({
  position,
  w,
  h,
  d,
  hue = 220,
}: {
  position: [number, number, number];
  w: number;
  h: number;
  d: number;
  hue?: number;
}) {
  const body = `hsl(${hue}, 12%, ${18 + (Math.abs(position[0] + position[2]) % 12)}%)`;
  const windows: React.ReactNode[] = [];
  const cols = Math.max(2, Math.floor(w / 1.4));
  const rows = Math.max(2, Math.floor(h / 1.6));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (Math.random() > 0.72) continue;
      const lit = Math.random() > 0.35;
      const wx = -w / 2 + 0.8 + c * ((w - 1.6) / Math.max(1, cols - 1));
      const wy = 0.6 + r * ((h - 1.2) / Math.max(1, rows - 1));
      windows.push(
        <mesh key={`${r}-${c}`} position={[wx, wy - h / 2, d / 2 + 0.02]}>
          <planeGeometry args={[0.55, 0.7]} />
          <meshStandardMaterial
            color={lit ? "#ffd8a0" : "#1a2230"}
            emissive={lit ? "#ffaa55" : "#000"}
            emissiveIntensity={lit ? 0.85 : 0}
            roughness={0.4}
          />
        </mesh>
      );
      // back face occasional
      if (Math.random() > 0.5) {
        windows.push(
          <mesh key={`b${r}-${c}`} position={[wx, wy - h / 2, -d / 2 - 0.02]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[0.55, 0.7]} />
            <meshStandardMaterial
              color={lit ? "#c8e0ff" : "#121820"}
              emissive={lit ? "#6688cc" : "#000"}
              emissiveIntensity={lit ? 0.6 : 0}
            />
          </mesh>
        );
      }
    }
  }
  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={body} roughness={0.85} metalness={0.05} />
      </mesh>
      {windows}
      {/* roof accent */}
      <mesh position={[0, h / 2 + 0.15, 0]}>
        <boxGeometry args={[w * 0.4, 0.3, d * 0.4]} />
        <meshStandardMaterial color="#222" />
      </mesh>
    </group>
  );
}

function StreetLamp({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 2.2, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 4.4, 6]} />
        <meshStandardMaterial color="#333" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 4.5, 0]}>
        <sphereGeometry args={[0.22, 8, 8]} />
        <meshStandardMaterial color="#ffe8a0" emissive="#ffcc66" emissiveIntensity={2} />
      </mesh>
      <pointLight position={[0, 4.3, 0]} intensity={1.2} distance={18} color="#ffd8a0" />
    </group>
  );
}

function NeonSign({ position, color, label }: { position: [number, number, number]; color: string; label?: string }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[3.2, 0.9, 0.15]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[0, 0, 0.1]}>
        <planeGeometry args={[2.8, 0.55]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.8} />
      </mesh>
      <pointLight position={[0, 0, 1]} intensity={0.8} distance={12} color={color} />
    </group>
  );
}

/** More car-like mesh than a box */
function VehicleMesh({
  defId,
  position,
  rotationY,
  police = false,
  id,
}: {
  defId: string;
  position: [number, number, number];
  rotationY: number;
  police?: boolean;
  id: string;
}) {
  const ref = useRef<THREE.Group>(null);
  useEffect(() => {
    if (ref.current) vehicleRegistry.meshes.set(id, ref.current);
    return () => {
      vehicleRegistry.meshes.delete(id);
    };
  }, [id]);

  const def = getVehicleDef(defId) || VEHICLE_CATALOG[0];
  const isMoto = def.class === "moto";
  const bodyColor = police ? "#eef0f2" : def.color;
  const cabinColor = police ? "#1a3a6a" : "#151515";

  if (isMoto) {
    return (
      <group ref={ref} position={position} rotation={[0, rotationY, 0]}>
        <mesh position={[0, 0.55, 0]} castShadow>
          <boxGeometry args={[0.45, 0.35, 1.9]} />
          <meshStandardMaterial color={bodyColor} metalness={0.5} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.35, 0.7]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.32, 0.32, 0.12, 12]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        <mesh position={[0, 0.35, -0.7]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.32, 0.32, 0.12, 12]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      </group>
    );
  }

  return (
    <group ref={ref} position={position} rotation={[0, rotationY, 0]}>
      {/* lower body */}
      <mesh position={[0, 0.38, 0]} castShadow>
        <boxGeometry args={[1.9, 0.42, 4.4]} />
        <meshStandardMaterial color={bodyColor} metalness={0.45} roughness={0.32} />
      </mesh>
      {/* cabin */}
      <mesh position={[0, 0.85, -0.15]} castShadow>
        <boxGeometry args={[1.7, 0.55, 2.1]} />
        <meshStandardMaterial color={cabinColor} metalness={0.25} roughness={0.4} />
      </mesh>
      {/* windshield hint */}
      <mesh position={[0, 0.95, 0.85]} rotation={[-0.35, 0, 0]}>
        <planeGeometry args={[1.55, 0.45]} />
        <meshStandardMaterial color="#88aacc" transparent opacity={0.35} metalness={0.8} roughness={0.1} />
      </mesh>
      {/* wheels */}
      {[
        [-0.85, 0.28, 1.35],
        [0.85, 0.28, 1.35],
        [-0.85, 0.28, -1.35],
        [0.85, 0.28, -1.35],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.32, 0.32, 0.22, 12]} />
          <meshStandardMaterial color="#0a0a0a" />
        </mesh>
      ))}
      {/* headlights */}
      <mesh position={[-0.55, 0.42, 2.15]}>
        <boxGeometry args={[0.35, 0.14, 0.08]} />
        <meshStandardMaterial color="#fff8e0" emissive="#ffe8a0" emissiveIntensity={police ? 0.3 : 1.2} />
      </mesh>
      <mesh position={[0.55, 0.42, 2.15]}>
        <boxGeometry args={[0.35, 0.14, 0.08]} />
        <meshStandardMaterial color="#fff8e0" emissive="#ffe8a0" emissiveIntensity={police ? 0.3 : 1.2} />
      </mesh>
      {/* tail */}
      <mesh position={[-0.55, 0.45, -2.15]}>
        <boxGeometry args={[0.3, 0.12, 0.06]} />
        <meshStandardMaterial color="#ff2222" emissive="#aa0000" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0.55, 0.45, -2.15]}>
        <boxGeometry args={[0.3, 0.12, 0.06]} />
        <meshStandardMaterial color="#ff2222" emissive="#aa0000" emissiveIntensity={0.8} />
      </mesh>
      {police && (
        <>
          <mesh position={[0, 1.25, 0]}>
            <boxGeometry args={[0.85, 0.14, 0.45]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
          <mesh position={[-0.22, 1.32, 0]}>
            <boxGeometry args={[0.28, 0.12, 0.32]} />
            <meshStandardMaterial color="#2244ff" emissive="#1133ff" emissiveIntensity={3} />
          </mesh>
          <mesh position={[0.22, 1.32, 0]}>
            <boxGeometry args={[0.28, 0.12, 0.32]} />
            <meshStandardMaterial color="#ff2222" emissive="#ff1111" emissiveIntensity={3} />
          </mesh>
          {/* side stripe */}
          <mesh position={[0.96, 0.5, 0]}>
            <boxGeometry args={[0.04, 0.25, 3.8]} />
            <meshStandardMaterial color="#1a3a8a" />
          </mesh>
          <mesh position={[-0.96, 0.5, 0]}>
            <boxGeometry args={[0.04, 0.25, 3.8]} />
            <meshStandardMaterial color="#1a3a8a" />
          </mesh>
        </>
      )}
    </group>
  );
}

function PlayerAndVehicleController() {
  const bodyRef = useRef<THREE.Group>(null);
  const keys = useRef(new Set<string>());
  const yaw = useRef(0);
  const driveSpeed = useRef(0);
  const { camera } = useThree();
  const setPlayerPos = useGameStore((s) => s.setPlayerPos);
  const setStamina = useGameStore((s) => s.setStamina);
  const setInVehicle = useGameStore((s) => s.setInVehicle);
  const reportCrime = useGameStore((s) => s.reportCrime);
  const checkMissionProximity = useGameStore((s) => s.checkMissionProximity);
  const tickWanted = useGameStore((s) => s.tickWanted);
  const player = useGameStore((s) => s.player);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keys.current.add(k);
      if (k === "p") useGameStore.getState().togglePhone();
      if (k === "f") {
        const state = useGameStore.getState();
        if (state.player.inVehicleId) {
          setInVehicle(null);
          driveSpeed.current = 0;
        } else {
          const pos = state.player.position;
          let best: WorldVehicle | null = null;
          let bestD = 5.5;
          for (const v of vehicleRegistry.list) {
            if (v.defId.includes("police")) continue;
            const d = Math.hypot(v.position[0] - pos[0], v.position[2] - pos[2]);
            if (d < bestD) {
              bestD = d;
              best = v;
            }
          }
          if (best) {
            setInVehicle(best.id);
            yaw.current = best.rotationY;
            if (bodyRef.current) bodyRef.current.position.set(best.position[0], 0, best.position[2]);
          }
        }
      }
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    const move = (e: MouseEvent) => {
      if (document.pointerLockElement) yaw.current -= e.movementX * 0.002;
    };
    const click = () => document.body.requestPointerLock();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("mousemove", move);
    window.addEventListener("click", click);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("click", click);
    };
  }, [setInVehicle]);

  useFrame((_, dt) => {
    if (!bodyRef.current) return;
    const inVeh = useGameStore.getState().player.inVehicleId;
    tickWanted(dt);

    if (inVeh) {
      const v = vehicleRegistry.list.find((x) => x.id === inVeh);
      const def = v ? getVehicleDef(v.defId) : null;
      const maxSp = def ? def.maxSpeed / 18 : 12;
      const accel = def ? def.acceleration * 14 : 10;
      const handling = def ? def.handling : 0.75;
      if (keys.current.has("w") || keys.current.has("arrowup")) driveSpeed.current = Math.min(maxSp, driveSpeed.current + accel * dt);
      else if (keys.current.has("s") || keys.current.has("arrowdown")) driveSpeed.current = Math.max(-maxSp * 0.4, driveSpeed.current - accel * 0.8 * dt);
      else {
        driveSpeed.current *= 1 - 2.2 * dt;
        if (Math.abs(driveSpeed.current) < 0.05) driveSpeed.current = 0;
      }
      if (keys.current.has("a") || keys.current.has("arrowleft"))
        yaw.current += handling * 1.6 * dt * Math.sign(driveSpeed.current || 1) * Math.min(1, Math.abs(driveSpeed.current) / 3);
      if (keys.current.has("d") || keys.current.has("arrowright"))
        yaw.current -= handling * 1.6 * dt * Math.sign(driveSpeed.current || 1) * Math.min(1, Math.abs(driveSpeed.current) / 3);
      bodyRef.current.position.x += Math.sin(yaw.current) * driveSpeed.current * dt;
      bodyRef.current.position.z += Math.cos(yaw.current) * driveSpeed.current * dt;
      bodyRef.current.position.y = 0;
      bodyRef.current.rotation.y = yaw.current;
      if (v) {
        v.position[0] = bodyRef.current.position.x;
        v.position[2] = bodyRef.current.position.z;
        v.rotationY = yaw.current;
        const mesh = vehicleRegistry.meshes.get(v.id);
        if (mesh) {
          mesh.position.copy(bodyRef.current.position);
          mesh.rotation.y = yaw.current;
        }
      }
      if (Math.abs(driveSpeed.current) > 14 && Math.random() < 0.002) reportCrime(1);
      const camDist = 9 + Math.abs(driveSpeed.current) * 0.15;
      const camOffset = new THREE.Vector3(0, 4.2, camDist).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw.current);
      camera.position.lerp(bodyRef.current.position.clone().add(camOffset), 0.08);
      camera.lookAt(bodyRef.current.position.clone().add(new THREE.Vector3(0, 1.2, 0)));
      const pos: [number, number, number] = [bodyRef.current.position.x, 0, bodyRef.current.position.z];
      setPlayerPos(pos, yaw.current, Math.abs(driveSpeed.current));
      checkMissionProximity(pos);
    } else {
      driveSpeed.current = 0;
      const sprint = keys.current.has("shift");
      const speed = sprint ? 11 : 5.5;
      const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw.current);
      const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw.current);
      const vel = new THREE.Vector3();
      if (keys.current.has("w") || keys.current.has("arrowup")) vel.add(forward);
      if (keys.current.has("s") || keys.current.has("arrowdown")) vel.sub(forward);
      if (keys.current.has("a") || keys.current.has("arrowleft")) vel.sub(right);
      if (keys.current.has("d") || keys.current.has("arrowright")) vel.add(right);
      if (vel.lengthSq() > 0) {
        vel.normalize().multiplyScalar(speed * dt);
        bodyRef.current.position.add(vel);
        bodyRef.current.position.y = 0;
        if (sprint) setStamina(useGameStore.getState().player.stamina - 16 * dt);
      } else {
        const st = useGameStore.getState().player.stamina;
        if (st < 100) setStamina(st + 14 * dt);
      }
      bodyRef.current.rotation.y = yaw.current;
      const camOffset = new THREE.Vector3(0, 3.6, 7.2).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw.current);
      camera.position.lerp(bodyRef.current.position.clone().add(camOffset), 0.12);
      camera.lookAt(bodyRef.current.position.clone().add(new THREE.Vector3(0, 1.4, 0)));
      const pos: [number, number, number] = [bodyRef.current.position.x, 0, bodyRef.current.position.z];
      setPlayerPos(pos, yaw.current, vel.length());
      checkMissionProximity(pos);
    }
  });

  const inVeh = player.inVehicleId;
  const bodyColor = player.gender === "female" ? "#d4a0a0" : "#b8b8c0";
  return (
    <group ref={bodyRef} position={player.position}>
      {!inVeh && (
        <>
          <mesh position={[0, 0.9, 0]} castShadow>
            <capsuleGeometry args={[0.32, 0.85, 4, 8]} />
            <meshStandardMaterial color={bodyColor} roughness={0.7} />
          </mesh>
          <mesh position={[0, 1.65, 0]} castShadow>
            <sphereGeometry args={[0.26, 12, 12]} />
            <meshStandardMaterial color="#e0b090" />
          </mesh>
        </>
      )}
    </group>
  );
}

function NightCity({ quality, decorative }: { quality: string; decorative: boolean }) {
  const buildings = useMemo(() => {
    const list: { pos: [number, number, number]; w: number; h: number; d: number; hue: number }[] = [];
    for (let i = -7; i <= 7; i++) {
      for (let j = -7; j <= 7; j++) {
        if (i % 3 === 0 || j % 3 === 0) continue;
        const h = 7 + ((Math.abs(i * 13 + j * 17)) % 26);
        list.push({
          pos: [i * 11, h / 2, j * 11],
          w: 8 + (Math.abs(i) % 3),
          h,
          d: 8 + (Math.abs(j) % 3),
          hue: 210 + ((i + j) % 40),
        });
      }
    }
    // outer
    for (let i = -11; i <= 11; i++) {
      for (let j = -11; j <= 11; j++) {
        if (Math.abs(i) < 8 && Math.abs(j) < 8) continue;
        if (i % 4 === 0 || j % 4 === 0) continue;
        if (Math.random() > 0.5) continue;
        const h = 4 + ((Math.abs(i * 5 + j * 7)) % 12);
        list.push({ pos: [i * 13, h / 2, j * 13], w: 7, h, d: 7, hue: 200 + (i % 30) });
      }
    }
    // landmark towers
    list.push({ pos: [0, 20, -52], w: 22, h: 40, d: 22, hue: 30 });
    list.push({ pos: [-14, 14, -52], w: 9, h: 28, d: 9, hue: 25 });
    list.push({ pos: [14, 14, -52], w: 9, h: 28, d: 9, hue: 25 });
    return list;
  }, []);

  const maxB = quality === "low" ? 70 : quality === "medium" ? 140 : 220;
  const lamps = useMemo(() => {
    const L: [number, number, number][] = [];
    for (let i = -8; i <= 8; i++) {
      L.push([i * 14, 0, 2.8]);
      L.push([i * 14, 0, -2.8]);
      L.push([2.8, 0, i * 14]);
      L.push([-2.8, 0, i * 14]);
    }
    return L.slice(0, quality === "low" ? 20 : 48);
  }, [quality]);

  return (
    <>
      {/* wet asphalt */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[360, 360]} />
        <meshStandardMaterial color="#14181c" metalness={0.55} roughness={0.25} />
      </mesh>
      {/* roads darker strips */}
      {Array.from({ length: 17 }, (_, i) => {
        const p = (i - 8) * 14;
        return (
          <group key={i}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[p, 0.01, 0]}>
              <planeGeometry args={[5, 360]} />
              <meshStandardMaterial color="#1a1e22" metalness={0.4} roughness={0.3} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, p]}>
              <planeGeometry args={[360, 5]} />
              <meshStandardMaterial color="#1a1e22" metalness={0.4} roughness={0.3} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[p, 0.025, 0]}>
              <planeGeometry args={[0.12, 360]} />
              <meshStandardMaterial color="#c9a86c" emissive="#6a5020" emissiveIntensity={0.15} />
            </mesh>
          </group>
        );
      })}
      {buildings.slice(0, maxB).map((b, i) => (
        <FancyBuilding key={i} position={b.pos} w={b.w} h={b.h} d={b.d} hue={b.hue} />
      ))}
      {lamps.map((p, i) => (
        <StreetLamp key={i} position={p} />
      ))}
      <NeonSign position={[12, 6, 18]} color="#ff2d6a" />
      <NeonSign position={[-18, 5, 10]} color="#2de0ff" />
      <NeonSign position={[8, 7, -22]} color="#7cff2d" />
      <NeonSign position={[-10, 5.5, -8]} color="#ffaa00" />
      {/* waterfront dark */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 95]}>
        <planeGeometry args={[180, 70]} />
        <meshStandardMaterial color="#0a1820" metalness={0.6} roughness={0.15} />
      </mesh>
    </>
  );
}

function NPCSystem({ count }: { count: number }) {
  const data = useRef(
    Array.from({ length: count }, (_, i) => ({
      position: [rand(-80, 80), 0, rand(-80, 80)] as [number, number, number],
      rotationY: rand(0, Math.PI * 2),
      state: (Math.random() > 0.6 ? "idle" : "walk") as "walk" | "idle" | "flee",
      speed: rand(1.1, 2),
      target: [rand(-70, 70), 0, rand(-70, 70)] as [number, number, number],
      color: `hsl(${Math.floor(Math.random() * 360)}, 40%, 48%)`,
    }))
  );
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!groupRef.current) return;
    const wanted = useGameStore.getState().player.wantedLevel;
    const playerPos = useGameStore.getState().player.position;
    data.current.forEach((npc, i) => {
      const mesh = groupRef.current!.children[i] as THREE.Group;
      if (!mesh) return;
      const dx = playerPos[0] - npc.position[0];
      const dz = playerPos[2] - npc.position[2];
      const dist = Math.hypot(dx, dz);
      if (wanted >= 2 && dist < 28 && npc.state !== "flee") {
        npc.state = "flee";
        npc.target = [npc.position[0] - dx * 2, 0, npc.position[2] - dz * 2];
      }
      if (npc.state === "walk" || npc.state === "flee") {
        const tx = npc.target[0] - npc.position[0];
        const tz = npc.target[2] - npc.position[2];
        const len = Math.hypot(tx, tz) || 1;
        const sp = npc.state === "flee" ? npc.speed * 1.9 : npc.speed;
        npc.position[0] += (tx / len) * sp * dt;
        npc.position[2] += (tz / len) * sp * dt;
        npc.rotationY = Math.atan2(tx, tz);
        if (len < 2) {
          npc.target = [rand(-80, 80), 0, rand(-80, 80)];
          if (npc.state === "flee" && dist > 45) npc.state = "walk";
        }
      }
      mesh.position.set(npc.position[0], 0, npc.position[2]);
      mesh.rotation.y = npc.rotationY;
    });
  });
  return (
    <group ref={groupRef}>
      {Array.from({ length: count }).map((_, i) => (
        <group key={i}>
          <mesh position={[0, 0.8, 0]} castShadow>
            <capsuleGeometry args={[0.22, 0.65, 3, 6]} />
            <meshStandardMaterial color={data.current[i]?.color || "#888"} />
          </mesh>
          <mesh position={[0, 1.4, 0]}>
            <sphereGeometry args={[0.2, 8, 8]} />
            <meshStandardMaterial color="#e0b090" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function VehicleSystem({ count, policeCount }: { count: number; policeCount: number }) {
  const ready = useRef(false);
  if (!ready.current && vehicleRegistry.list.length === 0) {
    const list: WorldVehicle[] = [];
    for (let i = 0; i < count; i++) {
      const def = randomCivilianVehicle();
      list.push({
        id: `car-${i}`,
        defId: def.id,
        position: [rand(-90, 90), 0, rand(-90, 90)],
        rotationY: rand(0, Math.PI * 2),
        velocity: 0,
        damaged: 0,
        locked: false,
      });
    }
    for (let i = 0; i < policeCount; i++) {
      list.push({
        id: `police-${i}`,
        defId: Math.random() > 0.5 ? "vostok-police" : "aura-police-suv",
        position: [rand(-60, 60), 0, rand(-60, 60)],
        rotationY: rand(0, Math.PI * 2),
        velocity: 0,
        damaged: 0,
        locked: true,
      });
    }
    // Hero police car near spawn for menu/screenshot vibe
    list.push({
      id: "police-hero",
      defId: "vostok-police",
      position: [4, 0, 6],
      rotationY: -0.6,
      velocity: 0,
      damaged: 0,
      locked: true,
    });
    vehicleRegistry.list = list;
    ready.current = true;
  }

  useFrame((_, dt) => {
    const wanted = useGameStore.getState().player.wantedLevel;
    const playerPos = useGameStore.getState().player.position;
    const inVeh = useGameStore.getState().player.inVehicleId;
    vehicleRegistry.list.forEach((v) => {
      if (v.id === inVeh) return;
      const isPolice = v.defId.includes("police");
      if (isPolice && wanted > 0) {
        const dx = playerPos[0] - v.position[0];
        const dz = playerPos[2] - v.position[2];
        const dist = Math.hypot(dx, dz) || 1;
        const speed = 9 + wanted * 2.2;
        v.position[0] += (dx / dist) * speed * dt;
        v.position[2] += (dz / dist) * speed * dt;
        v.rotationY = Math.atan2(dx, dz);
      } else if (!isPolice && Math.random() > 0.985) {
        v.rotationY += (Math.random() - 0.5) * 0.4;
        v.position[0] += Math.sin(v.rotationY) * 2 * dt;
        v.position[2] += Math.cos(v.rotationY) * 2 * dt;
      }
      const mesh = vehicleRegistry.meshes.get(v.id);
      if (mesh) {
        mesh.position.set(v.position[0], 0, v.position[2]);
        mesh.rotation.y = v.rotationY;
      }
    });
  });

  return (
    <group>
      {vehicleRegistry.list.map((v) => (
        <VehicleMesh key={v.id} id={v.id} defId={v.defId} position={v.position} rotationY={v.rotationY} police={v.defId.includes("police")} />
      ))}
    </group>
  );
}

function EnvironmentSystem({ decorative }: { decorative: boolean }) {
  const time = useGameStore((s) => s.time);
  const weather = useGameStore((s) => s.weather);
  const tickTime = useGameStore((s) => s.tickTime);
  const setWeather = useGameStore((s) => s.setWeather);
  const quality = useGameStore((s) => s.quality);

  useFrame((_, dt) => {
    if (!decorative) tickTime(dt);
    if (!decorative && Math.random() < 0.0002) {
      const opts: Array<"clear" | "cloudy" | "rain" | "fog"> = ["clear", "cloudy", "rain", "fog"];
      setWeather(opts[Math.floor(Math.random() * opts.length)]);
    }
  });

  // Menu = always cinematic night
  if (decorative) {
    return (
      <>
        <color attach="background" args={["#06080c"]} />
        <fog attach="fog" args={["#0a1018", 25, 110]} />
        <ambientLight intensity={0.25} />
        <directionalLight position={[20, 30, 10]} intensity={0.35} color="#8899bb" />
        <hemisphereLight args={["#203040", "#0a0806", 0.4]} />
        <Stars radius={120} depth={50} count={quality === "low" ? 400 : 1200} factor={3} fade speed={0.4} />
        <pointLight position={[4, 3, 6]} intensity={1.5} distance={20} color="#4466ff" />
        <pointLight position={[5, 3, 5]} intensity={1.2} distance={18} color="#ff3344" />
      </>
    );
  }

  const sunY = Math.sin(time.dayProgress * Math.PI * 2 - Math.PI / 2) * 40 + 10;
  const sunIntensity = Math.max(0.12, Math.sin(time.dayProgress * Math.PI) * 1.3);
  const night = sunIntensity < 0.35;
  return (
    <>
      <Sky sunPosition={[30, Math.max(2, sunY), 40]} turbidity={weather === "fog" ? 10 : 4} rayleigh={1.2} />
      <ambientLight intensity={0.22 + sunIntensity * 0.35} />
      <directionalLight
        position={[30, Math.max(5, sunY), 20]}
        intensity={sunIntensity}
        castShadow={quality !== "low"}
        shadow-mapSize={quality === "high" ? [2048, 2048] : [1024, 1024]}
      />
      {night && <Stars radius={140} depth={40} count={800} factor={2.5} fade />}
      {weather === "fog" && <fog attach="fog" args={["#6a7a8a", 25, 100]} />}
    </>
  );
}

function WorldContent({ decorative }: { decorative: boolean }) {
  const quality = useGameStore((s) => s.quality);
  const npcCount = decorative ? 12 : quality === "low" ? 18 : quality === "medium" ? 36 : 55;
  const carCount = decorative ? 10 : quality === "low" ? 12 : quality === "medium" ? 22 : 34;
  const policeCount = decorative ? 2 : quality === "low" ? 3 : 6;

  return (
    <>
      <EnvironmentSystem decorative={decorative} />
      <NightCity quality={decorative ? "medium" : quality} decorative={decorative} />
      {!decorative && <PlayerAndVehicleController />}
      <NPCSystem count={npcCount} />
      <VehicleSystem count={carCount} policeCount={policeCount} />
    </>
  );
}

export default function GameWorld({ decorative = false }: { decorative?: boolean }) {
  return (
    <Canvas
      shadows
      camera={{ position: decorative ? [8, 5, 14] : [18, 14, 26], fov: decorative ? 50 : 55, near: 0.1, far: 400 }}
      style={{ background: "#06080c" }}
      dpr={decorative ? [1, 1.5] : undefined}
    >
      <WorldContent decorative={decorative} />
    </Canvas>
  );
}
