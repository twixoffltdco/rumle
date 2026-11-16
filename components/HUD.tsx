"use client";

import { useGameStore } from "@/lib/store/gameStore";

export default function HUD({ onBack }: { onBack?: () => void }) {
  const player = useGameStore((s) => s.player);
  const time = useGameStore((s) => s.time);
  const weather = useGameStore((s) => s.weather);
  const togglePhone = useGameStore((s) => s.togglePhone);
  const toggleMask = useGameStore((s) => s.toggleMask);
  const activeMissionId = useGameStore((s) => s.activeMissionId);
  const missions = useGameStore((s) => s.missions);
  const policeMemory = useGameStore((s) => s.policeMemory);
  const isRecognized = useGameStore((s) => s.isRecognized);
  const nearShopId = useGameStore((s) => s.nearShopId);
  const activeMission = missions.find((m) => m.id === activeMissionId);
  const recognized = isRecognized();

  const stars = "★".repeat(player.wantedLevel) + "☆".repeat(5 - player.wantedLevel);
  const timeStr = `${String(time.hours).padStart(2, "0")}:${String(time.minutes).padStart(2, "0")}`;
  const speedKmh = Math.round(player.speed * 12);
  const outfitLabel: Record<string, string> = {
    street: "Улица",
    formal: "Классика",
    sport: "Спорт",
    work: "Рабочая",
  };

  return (
    <div className="hud-root">
      <div className="hud-top">
        <div className="hud-block">
          <b>RUMLE</b>
          <span>НОВОГРАД</span>
        </div>
        <div className="hud-block money">₽ {player.money.toLocaleString("ru-RU")}</div>
        <div className="hud-block time">
          {timeStr}
          {player.inVehicleId ? ` · ${speedKmh} км/ч` : ""}
          {player.maskOn ? " · МАСКА" : ""}
        </div>
      </div>

      {player.wantedLevel > 0 && (
        <div className="wanted">
          <span className="stars">{stars}</span>
          <small>РОЗЫСК</small>
          {policeMemory.active && (
            <small className={recognized ? "recog-hot" : "recog-cold"}>
              {recognized ? "ОПОЗНАН" : "ОБЛИК НЕ СОВПАДАЕТ"}
            </small>
          )}
        </div>
      )}

      <div className="bars">
        <div className="bar health">
          <div style={{ width: `${player.health}%` }} />
        </div>
        <div className="bar stamina">
          <div style={{ width: `${player.stamina}%` }} />
        </div>
      </div>

      {activeMission && (
        <div className="mission-tracker">
          <b>{activeMission.title}</b>
          <ul>
            {activeMission.objectives.map((o, i) => (
              <li key={i}>{o}</li>
            ))}
          </ul>
        </div>
      )}

      {nearShopId && (
        <div className="shop-hint">
          Магазин одежды — открой телефон (P) → Одежда
        </div>
      )}

      <div className="hud-bottom">
        <p>
          WASD · F — авто · <b>G</b> — маска · P — телефон · Shift — бег
          <br />
          Одежда: {outfitLabel[player.outfit] || player.outfit}
          {player.maskOn ? " · маска надета" : ""}
        </p>
        <div className="hud-actions">
          <button onClick={toggleMask}>{player.maskOn ? "Снять маску" : "Маска"}</button>
          <button onClick={togglePhone}>ТЕЛЕФОН</button>
          {onBack && <button onClick={onBack}>← МЕНЮ</button>}
        </div>
      </div>
    </div>
  );
}
