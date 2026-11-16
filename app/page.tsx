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
            <div>
              <h1>RUMLE</h1>
              <small>НОВОГРАД • OPEN WORLD</small>
            </div>
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
            <b>RUMLE</b>
            <span>НОВОГРАД</span>
            <p>WASD — движение · мышь — обзор · Shift — бег · клик — захват мыши</p>
            <button onClick={() => setScreen("menu")}>← МЕНЮ</button>
          </div>
        </div>
      )}

      {screen === "online" && <OnlineLobby onBack={() => setScreen("menu")} />}

      {screen === "settings" && (
        <SimplePanel title="НАСТРОЙКИ" onBack={() => setScreen("menu")}>
          <p>Графика, чувствительность мыши и привязки клавиш будут расширены в следующих версиях.</p>
          <p>Текущий прототип использует WebGL + React Three Fiber.</p>
        </SimplePanel>
      )}

      {screen === "credits" && (
        <SimplePanel title="RUMLE WEB" onBack={() => setScreen("menu")}>
          <p>Оригинальный open-source проект браузерной open-world игры. Не связан с Rockstar Games, GTA или любыми их торговыми марками.</p>
          <p>Город: Новоград. Технологии: Next.js, TypeScript, Three.js, React Three Fiber, PeerJS.</p>
          <p>Версия 0.3 — улучшенный город, автомобили, пешеходы, базовый онлайн-лобби.</p>
        </SimplePanel>
      )}
    </main>
  );
}

function SimplePanel({ title, onBack, children }: { title: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <div className="panel">
      <button className="back" onClick={onBack}>← НАЗАД</button>
      <h2>{title}</h2>
      <div className="panelBody">{children}</div>
    </div>
  );
}
