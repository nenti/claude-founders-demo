# From Prototype to Live App — Demo

Kursbegleitende Demo für Ridvans Abendkurs **„From Prototype to Live App"**.

Zeigt den kompletten Weg: statischer Prototyp → Frontend mit JavaScript → Backend-API.

## Was wird gebaut?

Ein **Ideen-Board**: Kursteilnehmer können Ideen einreichen, sehen sie sofort auf dem Board und können für Ideen abstimmen.

## Kursstruktur

| Schritt | Ordner | Inhalt |
|---------|--------|--------|
| 1 | `prototype/` | Statischer HTML-Prototyp (kein JS, kein Backend) |
| 2 | `backend/` | REST-API mit Node.js + Express |
| 3 | `frontend/` | Fertiges Frontend das mit der API kommuniziert |

## Schnellstart

### Backend starten
```bash
cd backend
npm install
npm start
# → läuft auf http://localhost:3000
```

### Frontend öffnen
```bash
# In einem zweiten Terminal
cd frontend
# Einfach index.html im Browser öffnen (z. B. mit Live Server in VS Code)
```

### Prototyp ansehen
```bash
# prototype/index.html direkt im Browser öffnen
```

## API-Endpunkte

| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| GET | `/api/ideas` | Alle Ideen abrufen |
| POST | `/api/ideas` | Neue Idee einreichen |
| POST | `/api/ideas/:id/like` | Für eine Idee abstimmen |

## Tech-Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (kein Framework nötig)
- **Backend**: Node.js, Express
- **Datenbank**: In-Memory (für den Kurs — kein Setup nötig)
