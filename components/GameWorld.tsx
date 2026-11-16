"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sky, Stars, Cloud } from "@react-three/drei";
import { useEffect, useRef, useMemo, useCallback } from "react";
import * as THREE from "three";
import { useGameStore } from "@/lib/store/gameStore";
import { VEHICLE_CATALOG, getVehicleDef, randomCivilianVehicle } from "@/lib/vehicles";
import type { NPC, WorldVehicle } from "@/lib/types/game";

// ---------- Helpers ----------
function rand(a: number, b: number) {
  return a + Math.random() * (b - a);
}

// ---------- Player ----------
function PlayerController() {
  const playerRef = useRef<THREE.Group>(null);
  const keys = useRef(new Set<string>());
  const yaw = useRef(0);
  const { camera } = useThree();
  const setPlayerPos = useGameStore((s) => s.setPlayerPos);
  const setStamina = useGameStore((s) => s.setStamina);
  const player = useGameStore((s) => s.player);
  const setInVehicle = useGameStore((s) => s.setInVehicle);
  const inVehicleId = player.inVehicleId;

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys.current.add(e.key.toLowerCase());
      if (e.key.toLowerCase() === "p") useGameStore.getState().togglePhone();
      if (e.key.toLowerCase() === "f") {
        // toggle vehicle - simplified: exit if in, else nearest
        if (inVehicleId) setInVehicle(null);
      }
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    const move = (e: MouseEvent) => {
      if (document.pointerLockElement) yaw.current -= e.movementX * 0.0022;
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
  }, [inVehicleId, setInVehicle]);

  useFrame((_, dt) => {
    if (!playerRef.current || inVehicleId) return;
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
      playerRef.current.position.add(vel);
      playerRef.current.position.y = 0;
      if (sprint) {
        const st = useGameStore.getState().player.stamina;
        setStamina(st - 18 * dt);
      }
    } else {
      const st = useGameStore.getState().player.stamina;
      if (st < 100) setStamina(st + 12 * dt);
    }

    playerRef.current.rotation.y = yaw.current;
    const camOffset = new THREE.Vector3(0, 3.8, 7.5).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw.current);
    camera.position.lerp(playerRef.current.position.clone().add(camOffset), 0.12);
    camera.lookAt(playerRef.current.position.clone().add(new THREE.Vector3(0, 1.4, 0)));

    setPlayerPos(
      [playerRef.current.position.x, playerRef.current.position.y, playerRef.current.position.z],
      yaw.current
    );
  });

  if (inVehicleId) return null;

  const bodyColor = player.gender === "female" ? "#d4a0a0" : "#c8c8c8";
  return (
    <group ref={playerRef} position={player.position}>
      <mesh position={[0, 0.9, 0]} castShadow>
        <capsuleGeometry args={[0.32, 0.85, 4, 8]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>
      <mesh position={[0, 1.65, 0]} castShadow>
        <sphereGeometry args={[0.26, 12, 12]} />
        <meshStandardMaterial color="#e0b090" />
      </mesh>
    </group>
  );
}

// ---------- Vehicle mesh ----------
function VehicleMesh({
  defId,
  position,
  rotationY,
  police = false,
}: {
  defId: string;
  position: [number, number, number];
  rotationY: number;
  police?: boolean;
}) {
  const def = getVehicleDef(defId) || VEHICLE_CATALOG[0];
  const isMoto = def.class === "moto";
  const isTruck = def.class === "truck" || def.class === "bus";
  const w = isMoto ? 0.7 : isTruck ? 2.4 : 1.85;
  const l = isMoto ? 2.2 : isTruck ? 6.5 : 4.3;
  const h = isMoto ? 0.9 : isTruck ? 1.6 : 0.55;

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, h / 2 + 0.15, 0]} castShadow>
        <boxGeometry args={[w, h, l]} />
        <meshStandardMaterial color={police ? "#e8e8e8" : def.color} metalness={0.4} roughness={0.35} />
      </mesh>
      {!isMoto && (
        <mesh position={[0, h + 0.35, -0.15]} castShadow>
          <boxGeometry args={[w * 0.9, 0.55, l * 0.55]} />
          <meshStandardMaterial color={police ? "#1a3a6a" : "#1a1a1a"} metalness={0.2} roughness={0.5} />
        </mesh>
      )}
      {/* Wheels */}
      {(isMoto
        ? [[0, 0.3, 0.85], [0, 0.3, -0.85]]
        : [
            [-w * 0.4, 0.28, l * 0.32],
            [w * 0.4, 0.28, l * 0.32],
            [-w * 0.4, 0.28, -l * 0.32],
            [w * 0.4, 0.28, -l * 0.32],
          ]
      ).map((p, i) => (
        <mesh key={i} position={p as [number, number, number]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.28, 0.28, isMoto ? 0.15 : 0.22, 10]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      ))}
      {police && (
        <>
          <mesh position={[0, h + 0.85, 0]}>
            <boxGeometry args={[0.7, 0.12, 0.4]} />
            <meshStandardMaterial color="#222" />
          </mesh>
          <mesh position={[-0.18, h + 0.9, 0]}>
            <boxGeometry args={[0.22, 0.1, 0.3]} />
            <meshStandardMaterial color="#2244ff" emissive="#1133cc" emissiveIntensity={2.5} />
          </mesh>
          <mesh position={[0.18, h + 0.9, 0]}>
            <boxGeometry args={[0.22, 0.1, 0.3]} />
            <meshStandardMaterial color="#ff2222" emissive="#cc1111" emissiveIntensity={2.5} />
          </mesh>
        </>
      )}
    </group>
  );
}

// ---------- City generation ----------
function CityDistricts({ quality }: { quality: string }) {
  const buildings = useMemo(() => {
    const list: { pos: [number, number, number]; size: [number, number, number]; color: string; district: string }[] = [];
    const colors = ["#3a4045", "#4a4648", "#2f3a42", "#3d3a38", "#353a40", "#2c3338", "#4a3a35", "#353840"];
    // Dense center
    for (let i = -6; i <= 6; i++) {
      for (let j = -6; j <= 6; j++) {
        if (i % 3 === 0 || j % 3 === 0) continue;
        const h = 8 + ((i * 11 + j * 17) % 28);
        list.push({
          pos: [i * 12, h / 2, j * 12],
          size: [9, h, 9],
          color: colors[Math.abs(i + j) % colors.length],
          district: "center",
        });
      }
    }
    // Residential outer
    for (let i = -12; i <= 12; i++) {
      for (let j = -12; j <= 12; j++) {
        if (Math.abs(i) < 7 && Math.abs(j) < 7) continue;
        if (i % 4 === 0 || j % 4 === 0) continue;
        if (Math.random() > 0.55) continue;
        const h = 3 + ((i * 5 + j * 7) % 10);
        list.push({
          pos: [i * 14, h / 2, j * 14],
          size: [8, h, 8],
          color: colors[(Math.abs(i * 3 + j) % colors.length)],
          district: "residential",
        });
      }
    }
    // Landmark: Novograd Citadel (original monumental complex)
    list.push({
      pos: [0, 18, -55],
      size: [28, 36, 28],
      color: "#5a5048",
      district: "landmark",
    });
    list.push({
      pos: [-12, 12, -55],
      size: [10, 24, 10],
      color: "#6a5a4a",
      district: "landmark",
    });
    list.push({
      pos: [12, 12, -55],
      size: [10, 24, 10],
      color: "#6a5a4a",
      district: "landmark",
    });
    return list;
  }, []);

  const maxBuildings = quality === "low" ? 80 : quality === "medium" ? 160 : 280;
  const visible = buildings.slice(0, maxBuildings);

  return (
    <>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#1c2022" roughness={0.92} />
      </mesh>

      {/* Roads grid */}
      {Array.from({ length: 25 }, (_, i) => {
        const p = (i - 12) * 14;
        return (
          <group key={i}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[p, 0.01, 0]}>
              <planeGeometry args={[4.2, 400]} />
              <meshStandardMaterial color="#282c2e" />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, p]}>
              <planeGeometry args={[400, 4.2]} />
              <meshStandardMaterial color="#282c2e" />
            </mesh>
          </group>
        );
      })}

      {/* Markings */}
      {Array.from({ length: 25 }, (_, i) => (
        <mesh key={`mk${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[(i - 12) * 14, 0.02, 0]}>
          <planeGeometry args={[0.14, 400]} />
          <meshStandardMaterial color="#c9a86c" />
        </mesh>
      ))}

      {visible.map((b, i) => (
        <mesh key={i} position={b.pos} castShadow receiveShadow>
          <boxGeometry args={b.size} />
          <meshStandardMaterial color={b.color} roughness={0.7} metalness={0.08} />
        </mesh>
      ))}

      {/* Waterfront */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 95]}>
        <planeGeometry args={[200, 80]} />
        <meshStandardMaterial color="#1a3040" metalness={0.3} roughness={0.2} />
      </mesh>
    </>
  );
}

// ---------- NPCs ----------
function NPCSystem({ count }: { count: number }) {
  const npcs = useRef<NPC[]>([]);
  const groupRef = useRef<THREE.Group>(null);
  const wanted = useGameStore((s) => s.player.wantedLevel);
  const playerPos = useGameStore((s) => s.player.position);

  useEffect(() => {
    npcs.current = Array.from({ length: count }, (_, i) => ({
      id: `npc-${i}`,
      position: [rand(-90, 90), 0, rand(-90, 90)] as [number, number, number],
      rotationY: rand(0, Math.PI * 2),
      state: Math.random() > 0.7 ? "idle" : "walk",
      gender: Math.random() > 0.5 ? "male" : "female",
      color: `hsl(${Math.floor(Math.random() * 360)}, 35%, 45%)`,
      speed: rand(1.1, 2.0),
      target: [rand(-80, 80), 0, rand(-80, 80)] as [number, number, number],
    }));
  }, [count]);

  useFrame((_, dt) => {
    if (!groupRef.current) return;
    const children = groupRef.current.children;
    npcs.current.forEach((npc, i) => {
      const mesh = children[i] as THREE.Group;
      if (!mesh) return;

      // React to wanted / player proximity
      const dx = playerPos[0] - npc.position[0];
      const dz = playerPos[2] - npc.position[2];
      const dist = Math.hypot(dx, dz);

      if (wanted >= 2 && dist < 25 && npc.state !== "flee") {
        npc.state = "flee";
        npc.target = [npc.position[0] - dx * 2, 0, npc.position[2] - dz * 2];
      } else if (wanted >= 3 && dist < 18 && Math.random() < 0.002) {
        npc.state = "call_police";
      }

      if (npc.state === "walk" || npc.state === "flee") {
        const tx = (npc.target?.[0] ?? 0) - npc.position[0];
        const tz = (npc.target?.[2] ?? 0) - npc.position[2];
        const len = Math.hypot(tx, tz) || 1;
        const sp = npc.state === "flee" ? npc.speed * 1.8 : npc.speed;
        npc.position[0] += (tx / len) * sp * dt;
        npc.position[2] += (tz / len) * sp * dt;
        npc.rotationY = Math.atan2(tx, tz);
        if (len < 2) {
          npc.target = [rand(-90, 90), 0, rand(-90, 90)];
          if (npc.state === "flee" && dist > 40) npc.state = "walk";
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
            <meshStandardMaterial color="#888" />
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

// ---------- World vehicles + simple police chase ----------
function VehicleSystem({ count, policeCount }: { count: number; policeCount: number }) {
  const vehicles = useRef<WorldVehicle[]>([]);
  const groupRef = useRef<THREE.Group>(null);
  const wanted = useGameStore((s) => s.player.wantedLevel);
  const playerPos = useGameStore((s) => s.player.position);
  const increaseWanted = useGameStore((s) => s.increaseWanted);

  useEffect(() => {
    const list: WorldVehicle[] = [];
    for (let i = 0; i < count; i++) {
      const def = randomCivilianVehicle();
      list.push({
        id: `car-${i}`,
        defId: def.id,
        position: [rand(-100, 100), 0, rand(-100, 100)],
        rotationY: rand(0, Math.PI * 2),
        velocity: 0,
        damaged: 0,
        locked: Math.random() > 0.4,
      });
    }
    for (let i = 0; i < policeCount; i++) {
      list.push({
        id: `police-${i}`,
        defId: Math.random() > 0.5 ? "vostok-police" : "aura-police-suv",
        position: [rand(-80, 80), 0, rand(-80, 80)],
        rotationY: rand(0, Math.PI * 2),
        velocity: 0,
        damaged: 0,
        locked: true,
      });
    }
    vehicles.current = list;
  }, [count, policeCount]);

  useFrame((_, dt) => {
    if (!groupRef.current) return;
    vehicles.current.forEach((v, i) => {
      const isPolice = v.defId.includes("police");
      if (isPolice && wanted > 0) {
        // simple chase toward player
        const dx = playerPos[0] - v.position[0];
        const dz = playerPos[2] - v.position[2];
        const dist = Math.hypot(dx, dz) || 1;
        const speed = 8 + wanted * 2;
        v.position[0] += (dx / dist) * speed * dt;
        v.position[2] += (dz / dist) * speed * dt;
        v.rotationY = Math.atan2(dx, dz);
        if (dist < 6 && wanted < 5 && Math.random() < 0.01) {
          // close contact can raise wanted slightly (witness)
          increaseWanted(0); // already has level
        }
      } else if (!isPolice) {
        // light traffic drift
        v.position[0] += Math.sin(v.rotationY) * 3 * dt * (Math.random() > 0.7 ? 1 : 0);
        v.position[2] += Math.cos(v.rotationY) * 3 * dt * (Math.random() > 0.7 ? 1 : 0);
      }
      const child = groupRef.current!.children[i];
      if (child) {
        child.position.set(v.position[0], 0, v.position[2]);
        child.rotation.y = v.rotationY;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {vehicles.current.length === 0
        ? null
        : vehicles.current.map((v) => (
            <VehicleMesh
              key={v.id}
              defId={v.defId}
              position={v.position}
              rotationY={v.rotationY}
              police={v.defId.includes("police")}
            />
          ))}
    </group>
  );
}

// ---------- Time / Weather / Lighting ----------
function EnvironmentSystem() {
  const time = useGameStore((s) => s.time);
  const weather = useGameStore((s) => s.weather);
  const tickTime = useGameStore((s) => s.tickTime);
  const setWeather = useGameStore((s) => s.setWeather);
  const quality = useGameStore((s) => s.quality);

  useFrame((_, dt) => {
    tickTime(dt);
    // occasional weather change
    if (Math.random() < 0.0003) {
      const opts: Array<"clear" | "cloudy" | "rain" | "fog"> = ["clear", "cloudy", "rain", "fog"];
      setWeather(opts[Math.floor(Math.random() * opts.length)]);
    }
  });

  const sunY = Math.sin(time.dayProgress * Math.PI * 2 - Math.PI / 2) * 40 + 10;
  const sunIntensity = Math.max(0.15, Math.sin(time.dayProgress * Math.PI) * 1.4);
  const ambient = 0.25 + sunIntensity * 0.4;

  return (
    <>
      <Sky
        sunPosition={[30, Math.max(2, sunY), 40]}
        turbidity={weather === "fog" ? 12 : weather === "rain" || weather === "storm" ? 8 : 4}
        rayleigh={weather === "clear" ? 1 : 2}
        mieCoefficient={0.005}
      />
      <ambientLight intensity={ambient} />
      <directionalLight
        position={[30, Math.max(5, sunY), 20]}
        intensity={sunIntensity}
        castShadow={quality !== "low"}
        shadow-mapSize={quality === "high" ? [2048, 2048] : [1024, 1024]}
      />
      {(weather === "rain" || weather === "storm") && (
        <Stars radius={150} depth={40} count={quality === "low" ? 200 : 600} factor={2} fade speed={3} />
      )}
      {weather === "fog" && <fog attach="fog" args={["#6a7a8a", 30, 120]} />}
      {weather === "cloudy" || weather === "rain" ? (
        <Cloud position={[20, 40, -30]} speed={0.2} opacity={0.4} segments={quality === "low" ? 10 : 20} />
      ) : null}
    </>
  );
}

// ---------- Main World ----------
function WorldContent({ decorative }: { decorative: boolean }) {
  const quality = useGameStore((s) => s.quality);
  const npcCount = decorative ? 0 : quality === "low" ? 18 : quality === "medium" ? 35 : 55;
  const carCount = decorative ? 8 : quality === "low" ? 12 : quality === "medium" ? 22 : 35;
  const policeCount = decorative ? 1 : quality === "low" ? 3 : 6;

  return (
    <>
      <EnvironmentSystem />
      <CityDistricts quality={decorative ? "low" : quality} />
      {!decorative && <PlayerController />}
      <NPCSystem count={npcCount} />
      <VehicleSystem count={carCount} policeCount={policeCount} />
    </>
  );
}

export default function GameWorld({ decorative = false }: { decorative?: boolean }) {
  return (
    <Canvas
      shadows
      camera={{ position: [18, 14, 26], fov: 55, near: 0.1, far: 500 }}
      style={{ background: "#0a0c10" }}
      dpr={decorative ? 1 : undefined}
    >
      <WorldContent decorative={decorative} />
    </Canvas>
  );
}
