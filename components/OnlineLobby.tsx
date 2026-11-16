"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Peer, { DataConnection } from "peerjs";
import GameWorld from "./GameWorld";

type Msg = { type: "chat" | "pos" | "join"; from: string; text?: string; x?: number; y?: number; z?: number };

export default function OnlineLobby({ onBack }: { onBack: () => void }) {
  const [peerId, setPeerId] = useState("");
  const [room, setRoom] = useState("");
  const [status, setStatus] = useState("Подключение к PeerServer…");
  const [messages, setMessages] = useState<string[]>([]);
  const [inGame, setInGame] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const peer = useRef<Peer | null>(null);
  const conn = useRef<DataConnection | null>(null);
  const isHost = useRef(false);

  useEffect(() => {
    const host = process.env.NEXT_PUBLIC_PEER_HOST || "0.peerjs.com";
    const port = Number(process.env.NEXT_PUBLIC_PEER_PORT || 443);
    const path = process.env.NEXT_PUBLIC_PEER_PATH || "/";
    const secure = process.env.NEXT_PUBLIC_PEER_SECURE !== "false";
    const p = new Peer(undefined, { host, port, path, secure, debug: 1 });
    peer.current = p;
    p.on("open", (id) => { setPeerId(id); setStatus("Готово. Создай комнату или подключись к другу."); });
    p.on("error", (e) => setStatus("PeerJS ошибка: " + e.type + " — " + e.message));
    p.on("connection", (c) => { attach(c); setStatus("Игрок подключился к вашей комнате"); });
    return () => { p.destroy(); };
  }, []);

  const attach = useCallback((c: DataConnection) => {
    conn.current = c;
    c.on("open", () => {
      setStatus("Соединение установлено. Можно заходить в мир.");
      c.send({ type: "join", from: peerId || "host" } as Msg);
    });
    c.on("data", (raw) => {
      const d = raw as Msg;
      if (d.type === "chat" && d.text) setMessages((m) => [...m.slice(-40), `${d.from}: ${d.text}`]);
      else if (d.type === "join") setMessages((m) => [...m, `▶ ${d.from} присоединился`]);
    });
    c.on("close", () => setStatus("Соединение закрыто"));
    c.on("error", () => setStatus("Ошибка соединения"));
  }, [peerId]);

  function host() {
    if (!peerId) return;
    isHost.current = true;
    setRoom(peerId);
    setStatus("Комната создана. Передай ID другу: " + peerId);
  }

  function join() {
    if (!peer.current || !room.trim()) return;
    isHost.current = false;
    const c = peer.current.connect(room.trim(), { reliable: true });
    attach(c);
    setStatus("Подключаемся к " + room.trim() + "…");
  }

  function sendChat() {
    const text = chatInput.trim();
    if (!text) return;
    if (conn.current?.open) conn.current.send({ type: "chat", from: peerId.slice(0, 6), text } as Msg);
    setMessages((m) => [...m.slice(-40), `Вы: ${text}`]);
    setChatInput("");
  }

  if (inGame) {
    return (
      <div className="gameScreen">
        <GameWorld />
        <div className="hud onlineHud">
          <b>RUMLE ONLINE</b>
          <span>{status}</span>
          <div className="miniChat">{messages.slice(-5).map((m, i) => <p key={i}>{m}</p>)}</div>
          <div className="chatRow">
            <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendChat()} placeholder="Чат…" />
            <button onClick={sendChat}>➤</button>
          </div>
          <button onClick={() => setInGame(false)}>← ЛОББИ</button>
        </div>
      </div>
    );
  }

  return (
    <div className="panel online">
      <button className="back" onClick={onBack}>← МЕНЮ</button>
      <h2>RUMLE <em>ONLINE</em></h2>
      <p className="status">{status}</p>
      <label>ТВОЙ PEER ID</label>
      <code>{peerId || "ожидание…"}</code>
      <button onClick={host} disabled={!peerId}>СОЗДАТЬ КОМНАТУ</button>
      <label>ID КОМНАТЫ ДРУГА</label>
      <input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="Вставь Peer ID друга" />
      <button onClick={join} disabled={!peerId || !room.trim()}>ПОДКЛЮЧИТЬСЯ</button>
      <button className="secondary" onClick={() => setInGame(true)}>ВОЙТИ В МИР</button>
      <div className="messages">{messages.map((m, i) => <p key={i}>{m}</p>)}</div>
      <small>
        Peer-to-peer через PeerJS. Позиции других игроков и полный синк мира будут добавлены на следующем этапе.
        Деньги и инвентарь — индивидуальные. Передача денег запрещена.
      </small>
    </div>
  );
}
