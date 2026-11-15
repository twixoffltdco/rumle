"use client";

import { useState } from "react";
import GameWorld from "@/components/GameWorld";
import OnlineLobby from "@/components/OnlineLobby";

type Screen = "menu" | "single" | "online" | "settings" | "credits";

export default function Home() {
  const [screen, setScreen] = useState<Screen>("menu");
  return (
    <main className="app">
      {screen === "menu" && (
        <div className="menuScene">
          <GameWorld decorative />
          <div className="shade" />
          <header className="brand">
            <div className="brandMark">R</div>
            <div><h1>RUMLE</h1><small>НОВОГРАД • OPEN WORLD</small></div>
          </header>
          <section className="menu">
            <p className="eyebrow">НОВАЯ ИГРА. НОВЫЙ МИР.</p>
            <button onClick={() => setScreen("single")}>НОВАЯ ИГРА <span>↗</span></button>
            <button onClick={() => setScreen("online")}>RUMLE ONLINE <span>↗</span></button>
            <button onClick={() => setScreen("settings")}>НАСТРОЙКИ <span>↗</span></button>
            <button onClick={() => setScreen("credits")}>О ПРОЕКТЕ <span>↗</span></button>
            <footer>OPEN SOURCE PROJECT <i>•</i> WEB BUILD 0.3</footer>
          </section>
          <div className="bottomNote">NOVOGRAD / 2026</div>
        </div>
      )}
      {screen === "single" && (
        <div className="gameScreen">
          <GameWorld />
          <div className="hud">
            <b>RUMLE</b><span>НОВОГРАД</span>
            <p>WASD / стрелки — движение · SHIFT — бег · E — сесть/выйти из машины</p>
            <button onClick={() => setScreen("menu")}>← МЕНЮ</button>
          </div>
          <div className="missionHud"><small>СВОБОДНЫЙ РЕЖИМ</small><strong>Исследуйте Новоград</strong><span>Найдите автомобиль и прокатитесь по городу</span></div>
        </div>
      )}
      {screen === "online" && <OnlineLobby onBack={() => setScreen("menu")} />}
      {screen === "settings" && <SimplePanel title="НАСТРОЙКИ" onBack={() => setScreen("menu")}>Настройки графики и управления будут расширяться в следующих версиях.</SimplePanel>}
      {screen === "credits" && <SimplePanel title="RUMLE WEB" onBack={() => setScreen("menu")}>Оригинальный open-source проект. Неофициальная игра, не связанная с Rockstar Games.</SimplePanel>}
    </main>
  );
}

function SimplePanel({ title, onBack, children }: { title: string; onBack: () => void; children: React.ReactNode }) {
  return <div className="panel"><button className="back" onClick={onBack}>← НАЗАД</button><h2>{title}</h2><p>{children}</p></div>;
}
