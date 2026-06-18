# 2026-06-18 · Hello World on Nyxory

A fun, interactive **Hello World** — and a demo of deploying to [Nyxory](https://nyxory.com) straight from Claude Code.

## Ziel

Eine kleine, freundliche Web-App bauen und live hosten.

## Was es macht

- 👋 Animierter, winkender Hand-Gruß
- 🌍 „Hello World" in 15 Sprachen — jeder Klick wechselt Sprache & Farbe
- 🎉 Konfetti bei jedem Klick / Tap
- Animierter Farbverlauf-Hintergrund

## Stack

- **Frontend:** statische `public/index.html` (Vanilla JS, Canvas-Konfetti, keine Build-Tools)
- **Server:** kleiner Express-Server (`server.js`) liefert den `public/`-Ordner aus, lauscht auf `PORT`
- **Hosting:** Nyxory (Cloud Native Buildpacks → Container → `*.nyxory.app`)

## Lokal starten

```bash
npm install
npm start
# → http://localhost:8080
```

## Ergebnis

Live deployed auf Nyxory. Public-URL siehe Deploy-Output / diese Datei wird nach dem Deploy aktualisiert.
