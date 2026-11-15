 "use client";
import { useEffect,useRef,useState } from "react";
import Peer,{DataConnection} from "peerjs";
export default function OnlineLobby({onBack}:{onBack:()=>void}){
 const [peerId,setPeerId]=useState("");const [room,setRoom]=useState("");const [status,setStatus]=useState("Подключение к PeerServer…");const [messages,setMessages]=useState<string[]>([]);const peer=useRef<Peer|null>(null);const conn=useRef<DataConnection|null>(null);
 useEffect(()=>{const p=new Peer(undefined,{host:process.env.NEXT_PUBLIC_PEER_HOST||"0.peerjs.com",port:Number(process.env.NEXT_PUBLIC_PEER_PORT||443),path:process.env.NEXT_PUBLIC_PEER_PATH||"/",secure:process.env.NEXT_PUBLIC_PEER_SECURE!=="false"});
 peer.current=p;p.on("open",id=>{setPeerId(id);setStatus("Готово к соединению")});p.on("error",e=>setStatus("PeerJS: "+e.message));p.on("connection",c=>attach(c));return()=>{p.destroy()}},[]);
 function attach(c:DataConnection){conn.current=c;c.on("open",()=>setStatus("В комнате: соединение установлено"));c.on("data",d=>setMessages(m=>[...m,String(d)]));c.on("close",()=>setStatus("Соединение закрыто"))}
 function host(){setRoom(peerId);setStatus("Комната создана. Передай ID другу.");}
 function join(){if(!peer.current||!room.trim())return;attach(peer.current.connect(room.trim(),{reliable:true}));setStatus("Подключаемся…")}
 function send(){const text=prompt("Сообщение в чат");if(text&&conn.current?.open){conn.current.send(text);setMessages(m=>[...m,"Вы: "+text])}}
 return <div className="panel online"><button className="back" onClick={onBack}>← МЕНЮ</button><h2>RUMLE <em>ONLINE</em></h2><p className="status">{status}</p><label>ТВОЙ PEER ID</label><code>{peerId||"…"}</code><button onClick={host}>СОЗДАТЬ КОМНАТУ</button><label>ID КОМНАТЫ ДРУГА</label><input value={room} onChange={e=>setRoom(e.target.value)} placeholder="Вставь Peer ID"/><button onClick={join}>ПОДКЛЮЧИТЬСЯ</button><button className="secondary" onClick={send}>ОТПРАВИТЬ СООБЩЕНИЕ</button><div className="messages">{messages.map((m,i)=><p key={i}>{m}</p>)}</div><small>Peer-to-peer тест. Игровая синхронизация появится следующим этапом.</small></div>
}
