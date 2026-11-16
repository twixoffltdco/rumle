"use client";

import { useState } from "react";
import { useGameStore } from "@/lib/store/gameStore";

type Tab = "home" | "map" | "missions" | "contacts" | "bank" | "settings";

export default function Phone() {
  const phoneOpen = useGameStore((s) => s.phoneOpen);
  const setPhoneOpen = useGameStore((s) => s.setPhoneOpen);
  const missions = useGameStore((s) => s.missions);
  const startMission = useGameStore((s) => s.startMission);
  const completeMission = useGameStore((s) => s.completeMission);
  const player = useGameStore((s) => s.player);
  const quality = useGameStore((s) => s.quality);
  const setQuality = useGameStore((s) => s.setQuality);
  const [tab, setTab] = useState<Tab>("home");

  if (!phoneOpen) return null;

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
                <button onClick={() => setTab("contacts")}>👤 Контакты</button>
                <button onClick={() => setTab("bank")}>💳 Банк</button>
                <button onClick={() => setTab("settings")}>⚙️ Настройки</button>
              </div>
            </div>
          )}

          {tab === "map" && (
            <div className="phone-page">
              <button className="back-tab" onClick={() => setTab("home")}>←</button>
              <h4>Карта Новограда</h4>
              <div className="mini-map">
                <div className="map-player" style={{ left: "50%", top: "55%" }} />
                <span className="map-label" style={{ left: "48%", top: "30%" }}>Центр</span>
                <span className="map-label" style={{ left: "20%", top: "60%" }}>Промзона</span>
                <span className="map-label" style={{ left: "70%", top: "70%" }}>Набережная</span>
                <span className="map-label" style={{ left: "55%", top: "15%" }}>Аэропорт</span>
              </div>
              <p className="hint">GPS и маршруты — в следующих обновлениях</p>
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
                      <span>{m.status === "available" ? "Доступно" : m.status === "active" ? "Активно" : m.status === "completed" ? "Выполнено" : m.status}</span>
                    </div>
                    {m.status === "available" && (
                      <button onClick={() => startMission(m.id)}>Принять</button>
                    )}
                    {m.status === "active" && (
                      <button onClick={() => completeMission(m.id)}>Завершить (тест)</button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {tab === "contacts" && (
            <div className="phone-page">
              <button className="back-tab" onClick={() => setTab("home")}>←</button>
              <h4>Контакты</h4>
              <ul className="contact-list">
                <li>Информатор «Серый»</li>
                <li>Автосалон «Север»</li>
                <li>Гараж на Набережной</li>
                <li>Служба спасения (112)</li>
              </ul>
            </div>
          )}

          {tab === "bank" && (
            <div className="phone-page">
              <button className="back-tab" onClick={() => setTab("home")}>←</button>
              <h4>Банк Новограда</h4>
              <div className="bank-balance">
                <span>Личный счёт</span>
                <b>₽ {player.money.toLocaleString("ru-RU")}</b>
              </div>
              <p className="hint">Переводы между игроками отключены. Экономика индивидуальна.</p>
            </div>
          )}

          {tab === "settings" && (
            <div className="phone-page">
              <button className="back-tab" onClick={() => setTab("home")}>←</button>
              <h4>Настройки</h4>
              <label>Качество графики</label>
              <div className="quality-btns">
                {(["low", "medium", "high"] as const).map((q) => (
                  <button key={q} className={quality === q ? "active" : ""} onClick={() => setQuality(q)}>
                    {q === "low" ? "Низкое" : q === "medium" ? "Среднее" : "Высокое"}
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
