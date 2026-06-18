# 2026-06-18 · Hello World on Nyxory

A fun, interactive **Hello World** — and a demo of deploying to [Nyxory](https://nyxory.com) straight from Claude Code.

## Ziel

Eine kleine, freundliche Web-App bauen und live hosten.

## Was es macht

- 👋 Animierter, winkender Hand-Gruß
- 🌍 „Hello World" in 15 Sprachen — jeder Klick wechselt Sprache & Farbe
- 🎉 Konfetti bei jedem Klick / Tap
- Animierter Farbverlauf-Hintergrund

## Live

👉 **https://hello-fun-c2clh881udh18vo.nyxory.app**

## Stack

- **Frontend:** statische `public/index.html` (Vanilla JS, Canvas-Konfetti, keine Build-Tools)
- **Server:** kleiner Express-Server (`server.js`) liefert den `public/`-Ordner aus, lauscht auf `PORT`
- **Container:** `Dockerfile` auf `node:20-slim` (das CNB-Buildpack-Image fehlte `libatomic.so.1`)
- **Hosting:** Nyxory — Projekt `hello-world`, App `hello-fun`

## Lokal starten

```bash
npm install
npm start
# → http://localhost:8080
```

## Ergebnis

Live deployed auf Nyxory unter **https://hello-fun-c2clh881udh18vo.nyxory.app** — App `hello-fun`, 1/1 ready, Auto-Domain `Ready`.
