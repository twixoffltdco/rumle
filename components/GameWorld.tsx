"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sky, Stars } from "@react-three/drei";
import { useEffect, useRef, useMemo } from "react";
import * as THREE from "three";

function PlayerController({ playable }: { playable: boolean }) {
  const player = useRef<THREE.Group>(null);
  const keys = useRef(new Set<string>());
  const velocity = useRef(new THREE.Vector3());
  const yaw = useRef(0);
  const { camera } = useThree();

  useEffect(() => {
    if (!playable) return;
    const down = (e: KeyboardEvent) => keys.current.add(e.key.toLowerCase());
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    const move = (e: MouseEvent) => {
      if (document.pointerLockElement) yaw.current -= e.movementX * 0.002;
    };
    const click = () => { if (playable) document.body.requestPointerLock(); };
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
  }, [playable]);

  useFrame((_, dt) => {
    if (!player.current || !playable) return;
    const speed = keys.current.has("shift") ? 12 : 6;
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw.current);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw.current);
    velocity.current.set(0, 0, 0);
    if (keys.current.has("w") || keys.current.has("arrowup")) velocity.current.add(forward);
    if (keys.current.has("s") || keys.current.has("arrowdown")) velocity.current.sub(forward);
    if (keys.current.has("a") || keys.current.has("arrowleft")) velocity.current.sub(right);
    if (keys.current.has("d") || keys.current.has("arrowright")) velocity.current.add(right);
    if (velocity.current.lengthSq() > 0) {
      velocity.current.normalize().multiplyScalar(speed * dt);
      player.current.position.add(velocity.current);
      player.current.position.y = 0;
    }
    player.current.rotation.y = yaw.current;
    const camOffset = new THREE.Vector3(0, 4, 8).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw.current);
    camera.position.lerp(player.current.position.clone().add(camOffset), 0.1);
    camera.lookAt(player.current.position.clone().add(new THREE.Vector3(0, 1.5, 0)));
  });

  return (
    <group ref={player} position={[0, 0, 5]}>
      <mesh position={[0, 0.9, 0]} castShadow>
        <capsuleGeometry args={[0.35, 0.9, 4, 8]} />
        <meshStandardMaterial color="#c8c8c8" />
      </mesh>
      <mesh position={[0, 1.7, 0]} castShadow>
        <sphereGeometry args={[0.28, 12, 12]} />
        <meshStandardMaterial color="#e0b090" />
      </mesh>
    </group>
  );
}

function Building({ position, size, color }: { position: [number, number, number]; size: [number, number, number]; color: string }) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.7} metalness={0.1} />
    </mesh>
  );
}

function Car({ position, color = "#2a5a8a", police = false }: { position: [number, number, number]; color?: string; police?: boolean }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[1.8, 0.5, 4.2]} />
        <meshStandardMaterial color={police ? "#e8e8e8" : color} />
      </mesh>
      <mesh position={[0, 0.85, -0.2]} castShadow>
        <boxGeometry args={[1.6, 0.55, 2.2]} />
        <meshStandardMaterial color={police ? "#1a3a6a" : "#222"} />
      </mesh>
      {[[-0.7, 0.25, 1.3], [0.7, 0.25, 1.3], [-0.7, 0.25, -1.3], [0.7, 0.25, -1.3]].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.3, 0.3, 0.25, 12]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      ))}
      {police && (
        <>
          <mesh position={[0, 1.25, 0]}>
            <boxGeometry args={[0.8, 0.15, 0.5]} />
            <meshStandardMaterial color="#222" />
          </mesh>
          <mesh position={[-0.2, 1.3, 0]}>
            <boxGeometry args={[0.25, 0.12, 0.35]} />
            <meshStandardMaterial color="#2244ff" emissive="#1122aa" emissiveIntensity={2} />
          </mesh>
          <mesh position={[0.2, 1.3, 0]}>
            <boxGeometry args={[0.25, 0.12, 0.35]} />
            <meshStandardMaterial color="#ff2222" emissive="#aa1111" emissiveIntensity={2} />
          </mesh>
        </>
      )}
    </group>
  );
}

function Pedestrian({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);
  const dir = useMemo(() => new THREE.Vector3((Math.random() - 0.5) * 2, 0, (Math.random() - 0.5) * 2).normalize(), []);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.position.addScaledVector(dir, dt * 1.2);
    if (Math.abs(ref.current.position.x) > 80 || Math.abs(ref.current.position.z) > 80) {
      dir.x *= -1; dir.z *= -1;
    }
  });
  return (
    <group ref={ref} position={position}>
      <mesh position={[0, 0.85, 0]}>
        <capsuleGeometry args={[0.25, 0.7, 4, 6]} />
        <meshStandardMaterial color={`hsl(${(position[0] * 17 + position[2] * 13) % 360}, 40%, 50%)`} />
      </mesh>
      <mesh position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.22, 8, 8]} />
        <meshStandardMaterial color="#e0b090" />
      </mesh>
    </group>
  );
}

function City({ playable = false, decorative = false }: { playable?: boolean; decorative?: boolean }) {
  const buildings = useMemo(() => {
    const list: { pos: [number, number, number]; size: [number, number, number]; color: string }[] = [];
    const colors = ["#3a4045", "#4a4648", "#2f3a42", "#3d3a38", "#353a40", "#2c3338"];
    for (let i = -8; i <= 8; i++) {
      for (let j = -8; j <= 8; j++) {
        if (i % 3 === 0 || j % 3 === 0) continue;
        const h = 4 + ((i * 7 + j * 13) % 18);
        list.push({ pos: [i * 10, h / 2, j * 10], size: [7.5, h, 7.5], color: colors[Math.abs(i + j) % colors.length] });
      }
    }
    return list;
  }, []);

  const cars = useMemo(() => {
    const list: { pos: [number, number, number]; color: string; police: boolean }[] = [];
    for (let i = 0; i < 18; i++) {
      list.push({
        pos: [(Math.random() - 0.5) * 140, 0, (Math.random() - 0.5) * 140],
        color: ["#2a5a8a", "#8a2a2a", "#2a8a4a", "#6a6a2a", "#4a4a4a"][i % 5],
        police: i % 7 === 0,
      });
    }
    return list;
  }, []);

  const peds = useMemo(() => Array.from({ length: 25 }, () => ({
    pos: [(Math.random() - 0.5) * 120, 0, (Math.random() - 0.5) * 120] as [number, number, number],
  })), []);

  return (
    <>
      <Sky sunPosition={decorative ? [20, 5, 40] : [80, 30, 40]} turbidity={decorative ? 8 : 4} rayleigh={decorative ? 2 : 1} />
      <ambientLight intensity={decorative ? 0.6 : 0.9} />
      <directionalLight position={[30, 50, 20]} intensity={decorative ? 1.2 : 1.8} castShadow shadow-mapSize={[1024, 1024]} />
      {decorative && <Stars radius={200} depth={60} count={1500} factor={3} fade speed={0.5} />}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial color="#1e2224" roughness={0.9} />
      </mesh>

      {Array.from({ length: 17 }, (_, i) => {
        const p = (i - 8) * 10;
        return (
          <group key={i}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[p, 0.01, 0]}>
              <planeGeometry args={[3.5, 300]} />
              <meshStandardMaterial color="#2a2e30" />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, p]}>
              <planeGeometry args={[300, 3.5]} />
              <meshStandardMaterial color="#2a2e30" />
            </mesh>
          </group>
        );
      })}

      {Array.from({ length: 17 }, (_, i) => (
        <mesh key={`m${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[(i - 8) * 10, 0.02, 0]}>
          <planeGeometry args={[0.12, 300]} />
          <meshStandardMaterial color="#d6b77a" />
        </mesh>
      ))}

      {buildings.map((b, i) => <Building key={i} position={b.pos} size={b.size} color={b.color} />)}
      {cars.map((c, i) => <Car key={i} position={c.pos} color={c.color} police={c.police} />)}
      {peds.map((p, i) => <Pedestrian key={i} position={p.pos} />)}
      {playable && <PlayerController playable={playable} />}
    </>
  );
}

export default function GameWorld({ decorative = false }: { decorative?: boolean }) {
  return (
    <Canvas shadows camera={{ position: [15, 12, 22], fov: 55, near: 0.1, far: 400 }} style={{ background: decorative ? "#0a0c10" : "#87a0b0" }}>
      <City playable={!decorative} decorative={decorative} />
    </Canvas>
  );
}
