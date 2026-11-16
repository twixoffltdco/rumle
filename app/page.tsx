"use client";

import { useState } from "react";
import GameWorld from "@/components/GameWorld";
import OnlineLobby from "@/components/OnlineLobby";
import HUD from "@/components/HUD";
import Phone from "@/components/Phone";
import Prologue from "@/components/Prologue";
import { useGameStore } from "@/lib/store/gameStore";

type Screen = "menu" | "prologue" | "single" | "online" | "settings" | "credits";

export default function Home() {
  const [screen, setScreen] = useState<Screen>("menu");
  const setGender = useGameStore((s) => s.setGender);
  const resetPlayer = useGameStore((s) => s.resetPlayer);
  const prologueDone = useGameStore((s) => s.prologueDone);

  function startGame() {
    resetPlayer();
    if (!prologueDone) setScreen("prologue");
    else setScreen("single");
  }

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
            <button onClick={startGame}>НОВАЯ ИГРА <span>↗</span></button>
            <button onClick={() => setScreen("online")}>RUMLE ONLINE <span>↗</span></button>
            <button onClick={() => setScreen("settings")}>НАСТРОЙКИ <span>↗</span></button>
            <button onClick={() => setScreen("credits")}>О ПРОЕКТЕ <span>↗</span></button>
            <footer>OPEN SOURCE <i>•</i> BUILD 0.7</footer>
          </section>
          <div className="bottomNote">NOVOGRAD / 2026</div>
        </div>
      )}

      {screen === "prologue" && (
        <div className="menuScene">
          <GameWorld decorative />
          <div className="shade" />
          <Prologue onDone={() => setScreen("single")} />
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
          <div className="quality-btns" style={{ maxWidth: 320, marginBottom: 16 }}>
            <button onClick={() => setGender("male")}>Мужской</button>
            <button onClick={() => setGender("female")}>Женский</button>
          </div>
          <p>G — маска. Смена одежды в магазинах (телефон → Одежда). Полиция запоминает облик.</p>
        </div>
      )}

      {screen === "credits" && (
        <div className="panel">
          <button className="back" onClick={() => setScreen("menu")}>← НАЗАД</button>
          <h2>RUMLE 0.7</h2>
          <p>Оригинальный проект. Не связан с Rockstar / GTA.</p>
          <p>Пролог, Цитадель, маска, память полиции по одежде, магазины одежды, езда, розыск.</p>
        </div>
      )}
    </main>
  );
}
