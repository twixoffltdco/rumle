"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Peer, { DataConnection } from "peerjs";
import GameWorld from "./GameWorld";
import HUD from "./HUD";
import Phone from "./Phone";
import { useGameStore } from "@/lib/store/gameStore";

type Msg =
  | { type: "chat"; from: string; text: string }
  | { type: "join"; from: string }
  | { type: "pos"; from: string; x: number; y: number; z: number; rot: number };

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
  const setOnline = useGameStore((s) => s.setOnline);

  useEffect(() => {
    const host = process.env.NEXT_PUBLIC_PEER_HOST || "0.peerjs.com";
    const port = Number(process.env.NEXT_PUBLIC_PEER_PORT || 443);
    const path = process.env.NEXT_PUBLIC_PEER_PATH || "/";
    const secure = process.env.NEXT_PUBLIC_PEER_SECURE !== "false";
    // Auto-generated Peer ID. Assertion satisfies strict TypeScript definitions.
    const p = new Peer(undefined as unknown as string, {
      host,
      port,
      path,
      secure,
      debug: 0,
    });
    peer.current = p;
    p.on("open", (id) => {
      setPeerId(id);
      setStatus("Готово. Создай комнату или подключись.");
      setOnline(true, id);
    });
    p.on("error", (e) => setStatus("PeerJS: " + e.type));
    p.on("connection", (c) => {
      attach(c);
      setStatus("Игрок подключился");
    });
    return () => {
      p.destroy();
      setOnline(false, null);
    };
  }, [setOnline]);

  const attach = useCallback(
    (c: DataConnection) => {
      conn.current = c;
      c.on("open", () => {
        setStatus("Соединение установлено");
        c.send({ type: "join", from: peerId || "host" });
      });
      c.on("data", (raw) => {
        const d = raw as Msg;
        if (d.type === "chat") setMessages((m) => [...m.slice(-30), `${d.from}: ${d.text}`]);
        if (d.type === "join") setMessages((m) => [...m, `▶ ${d.from} в сети`]);
      });
      c.on("close", () => setStatus("Соединение закрыто"));
    },
    [peerId]
  );

  function host() {
    if (!peerId) return;
    isHost.current = true;
    setRoom(peerId);
    setStatus("Комната: " + peerId + " — передай ID другу");
  }

  function join() {
    if (!peer.current || !room.trim()) return;
    isHost.current = false;
    const c = peer.current.connect(room.trim(), { reliable: true });
    attach(c);
    setStatus("Подключение…");
  }

  function sendChat() {
    const text = chatInput.trim();
    if (!text) return;
    if (conn.current?.open) {
      conn.current.send({ type: "chat", from: (peerId || "??").slice(0, 6), text });
    }
    setMessages((m) => [...m.slice(-30), `Вы: ${text}`]);
    setChatInput("");
  }

  if (inGame) {
    return (
      <div className="gameScreen">
        <GameWorld />
        <HUD onBack={() => setInGame(false)} />
        <Phone />
        <div className="online-chat-mini">
          {messages.slice(-3).map((m, i) => (
            <p key={i}>{m}</p>
          ))}
          <div className="chatRow">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendChat()}
              placeholder="Чат…"
            />
            <button onClick={sendChat}>➤</button>
          </div>
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
      <code>{peerId || "…"}</code>
      <button onClick={host} disabled={!peerId}>СОЗДАТЬ КОМНАТУ</button>
      <label>ID КОМНАТЫ</label>
      <input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="Peer ID друга" />
      <button onClick={join} disabled={!peerId || !room.trim()}>ПОДКЛЮЧИТЬСЯ</button>
      <button className="secondary" onClick={() => setInGame(true)}>ВОЙТИ В МИР</button>
      <div className="messages">{messages.map((m, i) => <p key={i}>{m}</p>)}</div>
      <small>
        Peer-to-peer (PeerJS). Синхронизация позиций и транспорта — в разработке.
        Экономика и инвентарь строго индивидуальные. Переводы денег запрещены.
      </small>
    </div>
  );
}
