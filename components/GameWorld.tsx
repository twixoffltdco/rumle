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

const vehicleRegistry = { list: [] as WorldVehicle[], meshes: new Map<string, THREE.Group>() };

const SHOPS = [
  { id: "shop-1", name: "ОДЕЖДА", position: [18, 0, 8] as [number, number, number], radius: 7 },
  { id: "shop-2", name: "ОДЕЖДА", position: [-22, 0, -14] as [number, number, number], radius: 7 },
  { id: "shop-3", name: "ОДЕЖДА", position: [8, 0, 40] as [number, number, number], radius: 7 },
];

function FancyBuilding({ position, w, h, d, hue = 220 }: { position: [number, number, number]; w: number; h: number; d: number; hue?: number }) {
  const body = `hsl(${hue}, 12%, ${16 + (Math.abs(position[0] + position[2]) % 10)}%)`;
  const windows: React.ReactNode[] = [];
  const cols = Math.max(2, Math.floor(w / 1.4));
  const rows = Math.max(2, Math.floor(h / 1.6));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (Math.random() > 0.7) continue;
      const lit = Math.random() > 0.32;
      const wx = -w / 2 + 0.8 + c * ((w - 1.6) / Math.max(1, cols - 1));
      const wy = 0.6 + r * ((h - 1.2) / Math.max(1, rows - 1));
      windows.push(
        <mesh key={`${r}-${c}`} position={[wx, wy - h / 2, d / 2 + 0.02]}>
          <planeGeometry args={[0.5, 0.65]} />
          <meshStandardMaterial color={lit ? "#ffd8a0" : "#151c28"} emissive={lit ? "#ffaa55" : "#000"} emissiveIntensity={lit ? 0.9 : 0} />
        </mesh>
      );
    }
  }
  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={body} roughness={0.85} />
      </mesh>
      {windows}
    </group>
  );
}

/** Original monumental complex — scale inspired by fortress, own design */
function NovogradCitadel() {
  return (
    <group position={[0, 0, -60]}>
      {/* walls */}
      <mesh position={[0, 4, 0]} castShadow>
        <boxGeometry args={[48, 8, 48]} />
        <meshStandardMaterial color="#4a4038" roughness={0.9} />
      </mesh>
      {/* inner keep */}
      <mesh position={[0, 14, 0]} castShadow>
        <boxGeometry args={[22, 20, 22]} />
        <meshStandardMaterial color="#5a4a40" roughness={0.85} />
      </mesh>
      {/* corner towers */}
      {[
        [-20, 12, -20],
        [20, 12, -20],
        [-20, 12, 20],
        [20, 12, 20],
      ].map((p, i) => (
        <group key={i} position={p as [number, number, number]}>
          <mesh castShadow>
            <cylinderGeometry args={[3.2, 3.6, 24, 8]} />
            <meshStandardMaterial color="#6a5a48" roughness={0.88} />
          </mesh>
          <mesh position={[0, 13, 0]}>
            <coneGeometry args={[3.8, 5, 8]} />
            <meshStandardMaterial color="#3a3028" />
          </mesh>
          {/* warm window band */}
          <mesh position={[0, 4, 3.3]}>
            <planeGeometry args={[1.2, 1.4]} />
            <meshStandardMaterial color="#ffcc88" emissive="#ffaa44" emissiveIntensity={1.2} />
          </mesh>
        </group>
      ))}
      {/* central spire */}
      <mesh position={[0, 28, 0]} castShadow>
        <cylinderGeometry args={[2, 3, 12, 8]} />
        <meshStandardMaterial color="#7a6a50" />
      </mesh>
      <mesh position={[0, 36, 0]}>
        <coneGeometry args={[2.8, 7, 8]} />
        <meshStandardMaterial color="#2a2420" />
      </mesh>
      <pointLight position={[0, 20, 0]} intensity={1.4} distance={55} color="#ffcc88" />
    </group>
  );
}

function StreetLamp({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 2.2, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 4.4, 6]} />
        <meshStandardMaterial color="#333" metalness={0.5} />
      </mesh>
      <mesh position={[0, 4.5, 0]}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshStandardMaterial color="#ffe8a0" emissive="#ffcc66" emissiveIntensity={2} />
      </mesh>
      <pointLight position={[0, 4.3, 0]} intensity={1.1} distance={16} color="#ffd8a0" />
    </group>
  );
}

function ShopMarker({ position, label }: { position: [number, number, number]; label: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 2.8, 0]}>
        <boxGeometry args={[2.4, 0.7, 0.12]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[0, 2.8, 0.08]}>
        <planeGeometry args={[2.1, 0.45]} />
        <meshStandardMaterial color="#e5b66c" emissive="#c49a4a" emissiveIntensity={1.2} />
      </mesh>
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.2, 16]} />
        <meshStandardMaterial color="#e5b66c" transparent opacity={0.15} />
      </mesh>
    </group>
  );
}

function VehicleMesh({ defId, position, rotationY, police = false, id }: { defId: string; position: [number, number, number]; rotationY: number; police?: boolean; id: string }) {
  const ref = useRef<THREE.Group>(null);
  useEffect(() => {
    if (ref.current) vehicleRegistry.meshes.set(id, ref.current);
    return () => { vehicleRegistry.meshes.delete(id); };
  }, [id]);
  const def = getVehicleDef(defId) || VEHICLE_CATALOG[0];
  const bodyColor = police ? "#eef0f2" : def.color;
  return (
    <group ref={ref} position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.38, 0]} castShadow>
        <boxGeometry args={[1.9, 0.42, 4.4]} />
        <meshStandardMaterial color={bodyColor} metalness={0.45} roughness={0.32} />
      </mesh>
      <mesh position={[0, 0.85, -0.15]} castShadow>
        <boxGeometry args={[1.7, 0.55, 2.1]} />
        <meshStandardMaterial color={police ? "#1a3a6a" : "#151515"} />
      </mesh>
      {[
        [-0.85, 0.28, 1.35], [0.85, 0.28, 1.35], [-0.85, 0.28, -1.35], [0.85, 0.28, -1.35],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.32, 0.32, 0.22, 12]} />
          <meshStandardMaterial color="#0a0a0a" />
        </mesh>
      ))}
      <mesh position={[-0.55, 0.42, 2.15]}>
        <boxGeometry args={[0.35, 0.14, 0.08]} />
        <meshStandardMaterial color="#fff8e0" emissive="#ffe8a0" emissiveIntensity={1.1} />
      </mesh>
      <mesh position={[0.55, 0.42, 2.15]}>
        <boxGeometry args={[0.35, 0.14, 0.08]} />
        <meshStandardMaterial color="#fff8e0" emissive="#ffe8a0" emissiveIntensity={1.1} />
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
        </>
      )}
    </group>
  );
}

function PlayerController() {
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
  const setNearShop = useGameStore((s) => s.setNearShop);
  const toggleMask = useGameStore((s) => s.toggleMask);
  const isRecognized = useGameStore((s) => s.isRecognized);
  const player = useGameStore((s) => s.player);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keys.current.add(k);
      if (k === "p") useGameStore.getState().togglePhone();
      if (k === "g") toggleMask();
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
            if (d < bestD) { bestD = d; best = v; }
          }
          if (best) {
            setInVehicle(best.id);
            yaw.current = best.rotationY;
            bodyRef.current?.position.set(best.position[0], 0, best.position[2]);
          }
        }
      }
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    const move = (e: MouseEvent) => { if (document.pointerLockElement) yaw.current -= e.movementX * 0.002; };
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
  }, [setInVehicle, toggleMask]);

  useFrame((_, dt) => {
    if (!bodyRef.current) return;
    const inVeh = useGameStore.getState().player.inVehicleId;
    tickWanted(dt);

    // Shop proximity
    const px = bodyRef.current.position.x;
    const pz = bodyRef.current.position.z;
    let near: string | null = null;
    for (const s of SHOPS) {
      if (Math.hypot(s.position[0] - px, s.position[2] - pz) < s.radius) near = s.id;
    }
    setNearShop(near);

    if (inVeh) {
      const v = vehicleRegistry.list.find((x) => x.id === inVeh);
      const def = v ? getVehicleDef(v.defId) : null;
      const maxSp = def ? def.maxSpeed / 18 : 12;
      const accel = def ? def.acceleration * 14 : 10;
      const handling = def ? def.handling : 0.75;
      if (keys.current.has("w") || keys.current.has("arrowup")) driveSpeed.current = Math.min(maxSp, driveSpeed.current + accel * dt);
      else if (keys.current.has("s") || keys.current.has("arrowdown")) driveSpeed.current = Math.max(-maxSp * 0.4, driveSpeed.current - accel * 0.8 * dt);
      else { driveSpeed.current *= 1 - 2.2 * dt; if (Math.abs(driveSpeed.current) < 0.05) driveSpeed.current = 0; }
      if (keys.current.has("a") || keys.current.has("arrowleft")) yaw.current += handling * 1.6 * dt * Math.sign(driveSpeed.current || 1) * Math.min(1, Math.abs(driveSpeed.current) / 3);
      if (keys.current.has("d") || keys.current.has("arrowright")) yaw.current -= handling * 1.6 * dt * Math.sign(driveSpeed.current || 1) * Math.min(1, Math.abs(driveSpeed.current) / 3);
      bodyRef.current.position.x += Math.sin(yaw.current) * driveSpeed.current * dt;
      bodyRef.current.position.z += Math.cos(yaw.current) * driveSpeed.current * dt;
      bodyRef.current.rotation.y = yaw.current;
      if (v) {
        v.position[0] = bodyRef.current.position.x;
        v.position[2] = bodyRef.current.position.z;
        v.rotationY = yaw.current;
        const mesh = vehicleRegistry.meshes.get(v.id);
        if (mesh) { mesh.position.copy(bodyRef.current.position); mesh.rotation.y = yaw.current; }
      }
      if (Math.abs(driveSpeed.current) > 14 && Math.random() < 0.002) reportCrime(1);
      const camOffset = new THREE.Vector3(0, 4.2, 9 + Math.abs(driveSpeed.current) * 0.15).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw.current);
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
  const outfitColors: Record<string, string> = { street: "#6a7a8a", formal: "#2a2a3a", sport: "#2a6a4a", work: "#6a5a3a" };
  const bodyColor = player.maskOn ? "#2a2a2a" : outfitColors[player.outfit] || "#b8b8c0";

  return (
    <group ref={bodyRef} position={player.position}>
      {!inVeh && (
        <>
          <mesh position={[0, 0.9, 0]} castShadow>
            <capsuleGeometry args={[0.32, 0.85, 4, 8]} />
            <meshStandardMaterial color={bodyColor} />
          </mesh>
          <mesh position={[0, 1.65, 0]} castShadow>
            <sphereGeometry args={[0.26, 12, 12]} />
            <meshStandardMaterial color={player.maskOn ? "#1a1a1a" : "#e0b090"} />
          </mesh>
        </>
      )}
    </group>
  );
}

function City({ quality }: { quality: string }) {
  const buildings = useMemo(() => {
    const list: { pos: [number, number, number]; w: number; h: number; d: number; hue: number }[] = [];
    for (let i = -7; i <= 7; i++) {
      for (let j = -5; j <= 7; j++) {
        if (i % 3 === 0 || j % 3 === 0) continue;
        if (j < -3 && Math.abs(i) < 3) continue; // keep citadel plaza clear
        const h = 7 + (Math.abs(i * 13 + j * 17) % 22);
        list.push({ pos: [i * 11, h / 2, j * 11], w: 8, h, d: 8, hue: 210 + ((i + j) % 30) });
      }
    }
    return list;
  }, []);
  const maxB = quality === "low" ? 60 : quality === "medium" ? 120 : 180;
  const lamps = useMemo(() => {
    const L: [number, number, number][] = [];
    for (let i = -6; i <= 6; i++) {
      L.push([i * 14, 0, 3], [i * 14, 0, -3]);
    }
    return L.slice(0, quality === "low" ? 16 : 36);
  }, [quality]);

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[360, 360]} />
        <meshStandardMaterial color="#14181c" metalness={0.5} roughness={0.28} />
      </mesh>
      {Array.from({ length: 15 }, (_, i) => {
        const p = (i - 7) * 14;
        return (
          <group key={i}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[p, 0.01, 0]}>
              <planeGeometry args={[5, 320]} />
              <meshStandardMaterial color="#1a1e22" metalness={0.4} roughness={0.3} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, p]}>
              <planeGeometry args={[320, 5]} />
              <meshStandardMaterial color="#1a1e22" metalness={0.4} roughness={0.3} />
            </mesh>
          </group>
        );
      })}
      {buildings.slice(0, maxB).map((b, i) => (
        <FancyBuilding key={i} position={b.pos} w={b.w} h={b.h} d={b.d} hue={b.hue} />
      ))}
      <NovogradCitadel />
      {lamps.map((p, i) => (
        <StreetLamp key={i} position={p} />
      ))}
      {SHOPS.map((s) => (
        <ShopMarker key={s.id} position={s.position} label={s.name} />
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 95]}>
        <planeGeometry args={[160, 60]} />
        <meshStandardMaterial color="#0a1820" metalness={0.55} roughness={0.2} />
      </mesh>
    </>
  );
}

function NPCSystem({ count }: { count: number }) {
  const data = useRef(Array.from({ length: count }, () => ({
    position: [rand(-70, 70), 0, rand(-50, 70)] as [number, number, number],
    rotationY: rand(0, Math.PI * 2),
    state: "walk" as "walk" | "flee",
    speed: rand(1.1, 2),
    target: [rand(-60, 60), 0, rand(-40, 60)] as [number, number, number],
    color: `hsl(${Math.floor(Math.random() * 360)}, 40%, 48%)`,
  })));
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
      if (wanted >= 2 && dist < 26) {
        npc.state = "flee";
        npc.target = [npc.position[0] - dx * 2, 0, npc.position[2] - dz * 2];
      }
      const tx = npc.target[0] - npc.position[0];
      const tz = npc.target[2] - npc.position[2];
      const len = Math.hypot(tx, tz) || 1;
      const sp = npc.state === "flee" ? npc.speed * 1.9 : npc.speed;
      npc.position[0] += (tx / len) * sp * dt;
      npc.position[2] += (tz / len) * sp * dt;
      npc.rotationY = Math.atan2(tx, tz);
      if (len < 2) {
        npc.target = [rand(-70, 70), 0, rand(-50, 70)];
        if (npc.state === "flee" && dist > 40) npc.state = "walk";
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
  if (vehicleRegistry.list.length === 0) {
    const list: WorldVehicle[] = [];
    for (let i = 0; i < count; i++) {
      const def = randomCivilianVehicle();
      list.push({ id: `car-${i}`, defId: def.id, position: [rand(-80, 80), 0, rand(-50, 80)], rotationY: rand(0, Math.PI * 2), velocity: 0, damaged: 0, locked: false });
    }
    for (let i = 0; i < policeCount; i++) {
      list.push({ id: `police-${i}`, defId: Math.random() > 0.5 ? "vostok-police" : "aura-police-suv", position: [rand(-50, 50), 0, rand(-40, 50)], rotationY: rand(0, Math.PI * 2), velocity: 0, damaged: 0, locked: true });
    }
    list.push({ id: "police-hero", defId: "vostok-police", position: [4, 0, 8], rotationY: -0.5, velocity: 0, damaged: 0, locked: true });
    vehicleRegistry.list = list;
  }
  useFrame((_, dt) => {
    const wanted = useGameStore.getState().player.wantedLevel;
    const playerPos = useGameStore.getState().player.position;
    const inVeh = useGameStore.getState().player.inVehicleId;
    const recognized = useGameStore.getState().isRecognized();
    vehicleRegistry.list.forEach((v) => {
      if (v.id === inVeh) return;
      const isPolice = v.defId.includes("police");
      // Chase only if wanted AND recognized (mask/outfit memory)
      if (isPolice && wanted > 0 && recognized) {
        const dx = playerPos[0] - v.position[0];
        const dz = playerPos[2] - v.position[2];
        const dist = Math.hypot(dx, dz) || 1;
        const speed = 9 + wanted * 2;
        v.position[0] += (dx / dist) * speed * dt;
        v.position[2] += (dz / dist) * speed * dt;
        v.rotationY = Math.atan2(dx, dz);
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
  const quality = useGameStore((s) => s.quality);
  const tickTime = useGameStore((s) => s.tickTime);
  useFrame((_, dt) => { if (!decorative) tickTime(dt); });
  if (decorative) {
    return (
      <>
        <color attach="background" args={["#06080c"]} />
        <fog attach="fog" args={["#0a1018", 28, 120]} />
        <ambientLight intensity={0.28} />
        <directionalLight position={[20, 30, 10]} intensity={0.4} color="#8899bb" />
        <Stars radius={120} depth={50} count={quality === "low" ? 400 : 1100} factor={3} fade speed={0.4} />
        <pointLight position={[4, 3, 8]} intensity={1.4} distance={22} color="#4466ff" />
        <pointLight position={[5, 3, 7]} intensity={1.1} distance={18} color="#ff3344" />
      </>
    );
  }
  return (
    <>
      <Sky sunPosition={[20, 8, 40]} turbidity={5} rayleigh={1.2} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[30, 40, 20]} intensity={0.9} castShadow={quality !== "low"} />
      <Stars radius={140} depth={40} count={600} factor={2} fade />
    </>
  );
}

function WorldContent({ decorative }: { decorative: boolean }) {
  const quality = useGameStore((s) => s.quality);
  const npcCount = decorative ? 10 : quality === "low" ? 16 : 32;
  const carCount = decorative ? 8 : quality === "low" ? 12 : 22;
  const policeCount = decorative ? 2 : 5;
  return (
    <>
      <EnvironmentSystem decorative={decorative} />
      <City quality={decorative ? "medium" : quality} />
      {!decorative && <PlayerController />}
      <NPCSystem count={npcCount} />
      <VehicleSystem count={carCount} policeCount={policeCount} />
    </>
  );
}

export default function GameWorld({ decorative = false }: { decorative?: boolean }) {
  return (
    <Canvas shadows camera={{ position: decorative ? [9, 4.5, 14] : [16, 12, 22], fov: decorative ? 48 : 55, near: 0.1, far: 400 }} style={{ background: "#06080c" }}>
      <WorldContent decorative={decorative} />
    </Canvas>
  );
}
