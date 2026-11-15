"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Sky, Stars } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

type WorldProps = { playable?: boolean };

function Building({ position, height, width, color }: {
  position: [number, number, number]; height: number; width: number; color: string;
}) {
  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, width]} />
        <meshStandardMaterial color={color} roughness={0.82} />
      </mesh>
      {Array.from({ length: Math.max(1, Math.floor(height / 2.4)) }, (_, floor) =>
        [-1, 1].flatMap((side) => [-1, 1].map((front) => (
          <mesh key={`${floor}-${side}-${front}`} position={[side * width * .28, 1.2 + floor * 2.4, front * (width / 2 + .012)]}>
            <boxGeometry args={[.72, .9, .035]} />
            <meshStandardMaterial color="#8da5ae" emissive="#263d46" emissiveIntensity={.22} />
          </mesh>
        )))
      )}
    </group>
  );
}

function Pedestrian({ index }: { index: number }) {
  const ref = useRef<THREE.Group>(null);
  const phase = index * 1.71;
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime * .32 + phase;
    ref.current.position.x = Math.sin(t) * 2.4 + (index % 5 - 2) * 5;
    ref.current.position.z = Math.cos(t * .7) * 2.2 + (Math.floor(index / 5) - 2) * 6;
    ref.current.rotation.y = Math.cos(t) > 0 ? 0 : Math.PI;
  });
  return (
    <group ref={ref} position={[0, 0, 0]}>
      <mesh position={[0, .88, 0]} castShadow><capsuleGeometry args={[.22, .65, 4, 7]} /><meshStandardMaterial color={["#b5a18a", "#657d8d", "#8c6d70", "#65745c"][index % 4]} /></mesh>
      <mesh position={[0, 1.48, 0]}><sphereGeometry args={[.19, 12, 10]} /><meshStandardMaterial color="#c69b7d" /></mesh>
    </group>
  );
}

function TrafficCar({ index, police = false }: { index: number; police?: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime * (police ? .55 : .34) + index * 9;
    ref.current.position.x = ((t * 3 + index * 13) % 82) - 41;
  });
  return (
    <group ref={ref} position={[0, 0, police ? -12 : 12]} rotation={[0, Math.PI / 2, 0]}>
      <mesh position={[0, .55, 0]} castShadow><boxGeometry args={[2.1, .75, 4.1]} /><meshStandardMaterial color={police ? "#e8e9e7" : ["#a84e42", "#334e63", "#b9a66d", "#4e6258"][index % 4]} metalness={.35} roughness={.45} /></mesh>
      <mesh position={[0, 1.05, 0]}><boxGeometry args={[1.7, .55, 2]} /><meshStandardMaterial color="#263b47" metalness={.2} roughness={.2} /></mesh>
      {[-1, 1].flatMap((x) => [-1.25, 1.25].map((z) => (
        <mesh key={`${x}-${z}`} position={[x * 1.03, .35, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[.34, .34, .16, 12]} /><meshStandardMaterial color="#101214" />
        </mesh>
      )))}
      {police && <mesh position={[0, 1.38, 0]}><boxGeometry args={[.8, .12, .28]} /><meshStandardMaterial color="#e54b48" emissive="#a31d1d" emissiveIntensity={1.5} /></mesh>}
    </group>
  );
}

function Player({ playable }: { playable: boolean }) {
  const player = useRef<THREE.Group>(null);
  const vehicle = useRef<THREE.Group>(null);
  const keys = useRef<Set<string>>(new Set());
  const inCar = useRef(false);
  const velocity = useRef(new THREE.Vector3());
  const cameraTarget = useRef(new THREE.Vector3());
  useEffect(() => {
    if (!playable) return;
    const down = (event: KeyboardEvent) => {
      keys.current.add(event.key.toLowerCase());
      if (event.key.toLowerCase() === "e" && !event.repeat) inCar.current = !inCar.current;
    };
    const up = (event: KeyboardEvent) => keys.current.delete(event.key.toLowerCase());
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [playable]);

  useFrame(({ camera }, delta) => {
    if (!playable || !player.current || !vehicle.current) return;
    const active = inCar.current ? vehicle.current : player.current;
    const input = new THREE.Vector3(
      Number(keys.current.has("d") || keys.current.has("arrowright")) - Number(keys.current.has("a") || keys.current.has("arrowleft")),
      0,
      Number(keys.current.has("s") || keys.current.has("arrowdown")) - Number(keys.current.has("w") || keys.current.has("arrowup"))
    );
    if (input.lengthSq() > 0) {
      input.normalize();
      const speed = inCar.current ? 13 : (keys.current.has("shift") ? 8 : 4.8);
      velocity.current.lerp(input.multiplyScalar(speed), Math.min(1, delta * 7));
      active.position.addScaledVector(velocity.current, delta);
      active.rotation.y = Math.atan2(velocity.current.x, velocity.current.z);
    } else {
      velocity.current.multiplyScalar(Math.max(0, 1 - delta * 8));
    }
    active.position.x = THREE.MathUtils.clamp(active.position.x, -55, 55);
    active.position.z = THREE.MathUtils.clamp(active.position.z, -55, 55);
    player.current.visible = !inCar.current;
    vehicle.current.visible = inCar.current;
    if (inCar.current) player.current.position.copy(vehicle.current.position);
    cameraTarget.current.copy(active.position);
    camera.position.lerp(new THREE.Vector3(active.position.x + 8, active.position.y + 9, active.position.z + 12), Math.min(1, delta * 2.5));
    camera.lookAt(cameraTarget.current.x, cameraTarget.current.y + 1, cameraTarget.current.z);
  });
  return (
    <>
      <group ref={player} position={[0, 0, 4]}>
        <mesh position={[0, .9, 0]} castShadow><capsuleGeometry args={[.34, .8, 4, 8]} /><meshStandardMaterial color="#d7d7d7" /></mesh>
        <mesh position={[0, 1.62, 0]}><sphereGeometry args={[.27, 16, 12]} /><meshStandardMaterial color="#bd9277" /></mesh>
      </group>
      <group ref={vehicle} position={[3, 0, 4]} visible={false}>
        <mesh position={[0, .55, 0]} castShadow><boxGeometry args={[2.2, .8, 4.2]} /><meshStandardMaterial color="#c49b58" metalness={.45} roughness={.35} /></mesh>
        <mesh position={[0, 1.1, -.2]}><boxGeometry args={[1.8, .55, 2]} /><meshStandardMaterial color="#263c48" /></mesh>
      </group>
    </>
  );
}

function City({ playable }: WorldProps) {
  const buildings = useMemo(() => {
    const items: Array<{ position: [number, number, number]; height: number; width: number; color: string }> = [];
    const palette = ["#39444a", "#4a4543", "#343f48", "#514b45", "#3d4844"];
    for (let x = -5; x <= 5; x++) for (let z = -5; z <= 5; z++) {
      if (x % 2 === 0 || z % 2 === 0 || (Math.abs(x) < 2 && Math.abs(z) < 2)) continue;
      const height = 4 + ((x * x + z * z * 3 + 17) % 7) * 1.45;
      items.push({ position: [x * 10, 0, z * 10], height, width: 6.5, color: palette[Math.abs(x * 3 + z) % palette.length] });
    }
    return items;
  }, []);
  return (
    <>
      <Sky sunPosition={[80, 25, 40]} />
      <ambientLight intensity={.85} />
      <directionalLight position={[20, 35, 15]} intensity={2.1} castShadow />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.12, 0]} receiveShadow>
        <planeGeometry args={[150, 150]} /><meshStandardMaterial color="#303638" />
      </mesh>
      {buildings.map((b, i) => <Building key={i} {...b} />)}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={`road-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[(i - 2.5) * 20, -.055, 0]}>
          <planeGeometry args={[7, 150]} /><meshStandardMaterial color="#171b1e" />
        </mesh>
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={`cross-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, -.052, (i - 2.5) * 20]}>
          <planeGeometry args={[150, 7]} /><meshStandardMaterial color="#171b1e" />
        </mesh>
      ))}
      {Array.from({ length: 18 }, (_, i) => <Pedestrian key={`npc-${i}`} index={i} />)}
      {Array.from({ length: 5 }, (_, i) => <TrafficCar key={`traffic-${i}`} index={i} />)}
      <TrafficCar index={0} police />
      <Player playable={playable} />
      <Stars radius={180} depth={50} count={700} factor={2} fade />
    </>
  );
}

export default function GameWorld({ decorative = false }: { decorative?: boolean }) {
  return (
    <Canvas shadows camera={{ position: [10, 11, 16], fov: 55 }} dpr={[1, 1.6]}>
      <City playable={!decorative} />
    </Canvas>
  );
}
