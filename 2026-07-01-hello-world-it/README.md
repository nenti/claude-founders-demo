# Hello World — für den IT-Typen

Eine ganz simple **Hello-World-Demo-Seite** mit Terminal-Look, geschrieben von
Claude und auf **nyxory** deployed.

## Ziel

Zeigen, dass der komplette Weg — Seite schreiben → committen → bauen →
öffentlich erreichbar machen — mit minimalem Aufwand funktioniert. Genau die
Art Ergebnis, über die sich ein IT-Typ freut: läuft, kein Ticket nötig.

## Inhalt

- `index.html` — eine einzige, eigenständige Datei. Kein Build, keine
  Dependencies. Terminal-Fenster + Statuskarten + kleiner Uptime-Zähler.
- `Dockerfile` — schlanker `nginx-unprivileged`-Container (Port 8080), der die
  statische Seite ausliefert. Nur fürs Deployment auf nyxory nötig.

## Lokal ansehen

```
open index.html
```

## Deployment

Als statische Website ins nyxory-Projekt `hello-world` deployed
(`*.nyxory.app`).
