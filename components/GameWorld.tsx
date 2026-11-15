 "use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sky, Stars } from "@react-three/drei";
import { useEffect, useRef } from "react";
import * as THREE from "three";
function City({playable=false}:{playable?:boolean}) {
 const player=useRef<THREE.Mesh>(null);
 useEffect(()=>{if(!playable)return;const keys=new Set<string>();const down=(e:KeyboardEvent)=>keys.add(e.key.toLowerCase());const up=(e:KeyboardEvent)=>keys.delete(e.key.toLowerCase());window.addEventListener("keydown",down);window.addEventListener("keyup",up);
 const tick=()=>{if(player.current){const s=.12;if(keys.has("w")||keys.has("arrowup"))player.current.position.z-=s;if(keys.has("s")||keys.has("arrowdown"))player.current.position.z+=s;if(keys.has("a")||keys.has("arrowleft"))player.current.position.x-=s;if(keys.has("d")||keys.has("arrowright"))player.current.position.x+=s;}requestAnimationFrame(tick)};const id=requestAnimationFrame(tick);return()=>{cancelAnimationFrame(id);window.removeEventListener("keydown",down);window.removeEventListener("keyup",up)}},[playable]);
 return <><Sky sunPosition={[100,20,100]}/><ambientLight intensity={1.3}/><directionalLight position={[20,30,10]} intensity={2}/>
 <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.1,0]}><planeGeometry args={[240,240]}/><meshStandardMaterial color="#252a2b"/></mesh>
 {Array.from({length:15},(_,i)=>Array.from({length:15},(_,j)=>{const x=(i-7)*8,z=(j-7)*8;const road=i%3===0||j%3===0;return road?null:<mesh key={`${i}-${j}`} position={[x,1.5,z]}><boxGeometry args={[5,3+(i*j)%12,5]}/><meshStandardMaterial color={["#3b4145","#4a4648","#303b42"][((i+j)%3)]}/></mesh>}))}
 {Array.from({length:12},(_,i)=><mesh key={i} position={[(i-6)*12,.03,0]}><boxGeometry args={[.12,.04,240]}/><meshStandardMaterial color="#d6b77a"/></mesh>)}
 <mesh ref={player} position={[0,.8,3]}><capsuleGeometry args={[.35,.8,4,8]}/><meshStandardMaterial color="#d7d7d7"/></mesh>
 <Stars radius={180} depth={50} count={1000} factor={3} fade/>
 </>;
}
export default function GameWorld({decorative=false}:{decorative?:boolean}){return <Canvas camera={{position:[12,12,18],fov:55}}><City playable={!decorative}/></Canvas>}
