# RUMLE WEB
Original browser open-world crime game concept. Not affiliated with Rockstar Games.

## Run locally
```bash
npm install
npm run dev
```
Open http://localhost:3000

## Deploy
Import this repository into Vercel and deploy the Next.js frontend.

## PeerJS
The online lobby currently demonstrates PeerJS ID connection and data messaging. Configure a PeerServer (or use the public PeerJS server for development) with `NEXT_PUBLIC_PEER_HOST`, `NEXT_PUBLIC_PEER_PORT`, `NEXT_PUBLIC_PEER_PATH`, and `NEXT_PUBLIC_PEER_SECURE`.

## Status
Prototype scaffold: cinematic menu, procedural block-city scene, basic movement, PeerJS lobby/chat. This is not yet a finished AAA game; vehicle physics, missions, police AI, persistent saves, character models, and authoritative gameplay remain future implementation work.
