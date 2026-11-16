"use client";

import { useState } from "react";
import GameWorld from "@/components/GameWorld";
import OnlineLobby from "@/components/OnlineLobby";
import HUD from "@/components/HUD";
import Phone from "@/components/Phone";
import { useGameStore } from "@/lib/store/gameStore";

type Screen = "menu" | "single" | "online" | "settings" | "credits";

export default function Home() {
  const [screen, setScreen] = useState<Screen>("menu");
  const setGender = useGameStore((s) => s.setGender);
  const resetPlayer = useGameStore((s) => s.resetPlayer);

  return (
    <main className="app">
      {screen === "menu" && (
        <div className="menuScene">
          <GameWorld decorative />
          <div className="shade" />
          <header className="brand">
            <div className="brandMark">R</div>
            <div>
              <h1>RUMLE</h1>
              <small>НОВОГРАД • OPEN WORLD</small>
            </div>
          </header>
          <section className="menu">
            <p className="eyebrow">ГОРОД. ЗАКОН. ВЫБОР.</p>
            <button onClick={() => { resetPlayer(); setScreen("single"); }}>
              НОВАЯ ИГРА <span>↗</span>
            </button>
            <button onClick={() => setScreen("online")}>
              RUMLE ONLINE <span>↗</span>
            </button>
            <button onClick={() => setScreen("settings")}>
              НАСТРОЙКИ <span>↗</span>
            </button>
            <button onClick={() => setScreen("credits")}>
              О ПРОЕКТЕ <span>↗</span>
            </button>
            <footer>OPEN SOURCE <i>•</i> BUILD 0.6 — NIGHT CITY</footer>
          </section>
          <div className="bottomNote">NOVOGRAD / 2026</div>
        </div>
      )}

      {screen === "single" && (
        <div className="gameScreen">
          <GameWorld />
          <HUD onBack={() => setScreen("menu")} />
          <Phone />
        </div>
      )}

      {screen === "online" && <OnlineLobby onBack={() => setScreen("menu")} />}

      {screen === "settings" && (
        <div className="panel">
          <button className="back" onClick={() => setScreen("menu")}>← НАЗАД</button>
          <h2>НАСТРОЙКИ</h2>
          <p>Персонаж:</p>
          <div className="quality-btns" style={{ marginBottom: 20, maxWidth: 320 }}>
            <button onClick={() => setGender("male")}>Мужской</button>
            <button onClick={() => setGender("female")}>Женский</button>
          </div>
          <p>Качество графики — в телефоне (P) во время игры.</p>
          <p>Сохранения пишутся в localStorage автоматически.</p>
        </div>
      )}

      {screen === "credits" && (
        <div className="panel">
          <button className="back" onClick={() => setScreen("menu")}>← НАЗАД</button>
          <h2>RUMLE WEB 0.6</h2>
          <p>Оригинальный open-world проект. Не связан с Rockstar Games и GTA.</p>
          <p>Ночной город, неон, окна, полицейский транспорт, езда (F), розыск, миссии, телефон.</p>
          <p>Стек: Next.js · Three.js · React Three Fiber · PeerJS · Zustand</p>
        </div>
      )}
    </main>
  );
}
