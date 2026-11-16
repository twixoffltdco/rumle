"use client";

import { useGameStore } from "@/lib/store/gameStore";

export default function HUD({ onBack }: { onBack?: () => void }) {
  const player = useGameStore((s) => s.player);
  const time = useGameStore((s) => s.time);
  const weather = useGameStore((s) => s.weather);
  const togglePhone = useGameStore((s) => s.togglePhone);
  const activeMissionId = useGameStore((s) => s.activeMissionId);
  const missions = useGameStore((s) => s.missions);
  const activeMission = missions.find((m) => m.id === activeMissionId);

  const stars = "★".repeat(player.wantedLevel) + "☆".repeat(5 - player.wantedLevel);
  const timeStr = `${String(time.hours).padStart(2, "0")}:${String(time.minutes).padStart(2, "0")}`;
  const speedKmh = Math.round(player.speed * 12);

  return (
    <div className="hud-root">
      <div className="hud-top">
        <div className="hud-block">
          <b>RUMLE</b>
          <span>НОВОГРАД</span>
        </div>
        <div className="hud-block money">₽ {player.money.toLocaleString("ru-RU")}</div>
        <div className="hud-block time">
          {timeStr} · {weatherLabel(weather)}
          {player.inVehicleId ? ` · ${speedKmh} км/ч` : ""}
        </div>
      </div>

      {player.wantedLevel > 0 && (
        <div className="wanted">
          <span className="stars">{stars}</span>
          <small>РОЗЫСК</small>
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
          <small style={{ color: "#8fdf8f" }}>Доберись до точки — задание закроется само</small>
        </div>
      )}

      <div className="hud-bottom">
        <p>
          WASD · мышь · <b>F</b> — сесть/выйти · P — телефон · Shift — бег
          {player.inVehicleId ? " · вы в машине" : " · подойди к авто и нажми F"}
        </p>
        <div className="hud-actions">
          <button onClick={togglePhone}>ТЕЛЕФОН</button>
          {onBack && <button onClick={onBack}>← МЕНЮ</button>}
        </div>
      </div>
    </div>
  );
}

function weatherLabel(w: string) {
  const map: Record<string, string> = {
    clear: "Ясно",
    cloudy: "Облачно",
    rain: "Дождь",
    storm: "Гроза",
    fog: "Туман",
  };
  return map[w] || w;
}
