"use client";

import { useState } from "react";
import { useGameStore } from "@/lib/store/gameStore";
import type { OutfitId } from "@/lib/types/game";

type Tab = "home" | "map" | "missions" | "clothes" | "bank" | "settings";

const OUTFITS: { id: OutfitId; name: string; price: number }[] = [
  { id: "street", name: "Уличный", price: 500 },
  { id: "formal", name: "Классика", price: 2000 },
  { id: "sport", name: "Спорт", price: 1200 },
  { id: "work", name: "Рабочий", price: 800 },
];

export default function Phone() {
  const phoneOpen = useGameStore((s) => s.phoneOpen);
  const setPhoneOpen = useGameStore((s) => s.setPhoneOpen);
  const missions = useGameStore((s) => s.missions);
  const startMission = useGameStore((s) => s.startMission);
  const completeMission = useGameStore((s) => s.completeMission);
  const player = useGameStore((s) => s.player);
  const quality = useGameStore((s) => s.quality);
  const setQuality = useGameStore((s) => s.setQuality);
  const nearShopId = useGameStore((s) => s.nearShopId);
  const buyOutfit = useGameStore((s) => s.buyOutfit);
  const toggleMask = useGameStore((s) => s.toggleMask);
  const policeMemory = useGameStore((s) => s.policeMemory);
  const [tab, setTab] = useState<Tab>("home");
  const [msg, setMsg] = useState("");

  if (!phoneOpen) return null;

  function tryBuy(id: OutfitId, price: number) {
    if (!nearShopId) {
      setMsg("Подойди к магазину одежды в городе");
      return;
    }
    const ok = buyOutfit(id, price);
    setMsg(ok ? "Облик изменён. Полиции сложнее опознать." : "Недостаточно денег или уже надет");
  }

  return (
    <div className="phone-overlay" onClick={() => setPhoneOpen(false)}>
      <div className="phone" onClick={(e) => e.stopPropagation()}>
        <div className="phone-notch" />
        <div className="phone-screen">
          {tab === "home" && (
            <div className="phone-home">
              <h3>RUMLE OS</h3>
              <div className="app-grid">
                <button onClick={() => setTab("map")}>🗺 Карта</button>
                <button onClick={() => setTab("missions")}>📋 Задания</button>
                <button onClick={() => setTab("clothes")}>👕 Одежда</button>
                <button onClick={() => setTab("bank")}>💳 Банк</button>
                <button onClick={() => setTab("settings")}>⚙️ Настройки</button>
                <button onClick={toggleMask}>{player.maskOn ? "Снять маску" : "Надеть маску"}</button>
              </div>
            </div>
          )}

          {tab === "map" && (
            <div className="phone-page">
              <button className="back-tab" onClick={() => setTab("home")}>←</button>
              <h4>Новоград</h4>
              <div className="mini-map">
                <div className="map-player" style={{ left: "50%", top: "55%" }} />
                <span className="map-label" style={{ left: "50%", top: "22%" }}>Цитадель</span>
                <span className="map-label" style={{ left: "70%", top: "50%" }}>Одежда</span>
                <span className="map-label" style={{ left: "50%", top: "82%" }}>Набережная</span>
              </div>
            </div>
          )}

          {tab === "missions" && (
            <div className="phone-page">
              <button className="back-tab" onClick={() => setTab("home")}>←</button>
              <h4>Задания</h4>
              <ul className="mission-list">
                {missions.map((m) => (
                  <li key={m.id} className={m.status}>
                    <b>{m.title}</b>
                    <small>{m.description}</small>
                    <div className="mission-meta">
                      <span>₽ {m.reward}</span>
                      <span>{m.status}</span>
                    </div>
                    {m.status === "available" && <button onClick={() => startMission(m.id)}>Принять</button>}
                    {m.status === "active" && m.id !== "m2" && (
                      <button onClick={() => completeMission(m.id)}>Сдать (тест)</button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {tab === "clothes" && (
            <div className="phone-page">
              <button className="back-tab" onClick={() => setTab("home")}>←</button>
              <h4>Одежда</h4>
              <p className="hint">
                {nearShopId
                  ? "Ты у магазина — можно сменить комплект"
                  : "Подойди к точке «ОДЕЖДА» в мире, затем покупай здесь"}
              </p>
              <p className="hint">
                Сейчас: {player.outfit}
                {player.maskOn ? " + маска" : ""}
                {policeMemory.active ? " · есть ориентировка" : ""}
              </p>
              {OUTFITS.map((o) => (
                <button
                  key={o.id}
                  className="cloth-btn"
                  onClick={() => tryBuy(o.id, o.price)}
                  disabled={player.outfit === o.id}
                >
                  {o.name} — ₽ {o.price}
                  {player.outfit === o.id ? " (надет)" : ""}
                </button>
              ))}
              {msg && <p className="hint" style={{ color: "#e5b66c" }}>{msg}</p>}
            </div>
          )}

          {tab === "bank" && (
            <div className="phone-page">
              <button className="back-tab" onClick={() => setTab("home")}>←</button>
              <h4>Банк</h4>
              <div className="bank-balance">
                <span>Счёт</span>
                <b>₽ {player.money.toLocaleString("ru-RU")}</b>
              </div>
              <p className="hint">Переводы между игроками отключены.</p>
            </div>
          )}

          {tab === "settings" && (
            <div className="phone-page">
              <button className="back-tab" onClick={() => setTab("home")}>←</button>
              <h4>Графика</h4>
              <div className="quality-btns">
                {(["low", "medium", "high"] as const).map((q) => (
                  <button key={q} className={quality === q ? "active" : ""} onClick={() => setQuality(q)}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <button className="phone-home-btn" onClick={() => setPhoneOpen(false)} />
      </div>
    </div>
  );
}
