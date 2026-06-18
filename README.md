# claude-founders-demo

Demo-Sammlung. **Jeder Demo-Run bekommt einen eigenen Unterordner** — nichts wird direkt im Repo-Root abgelegt.

## Konvention

Lege für jeden Demo-Run einen neuen Unterordner an, z. B.:

```
claude-founders-demo/
├── README.md
├── 2026-06-18-erste-demo/
│   └── ...
├── 2026-06-19-zweite-demo/
│   └── ...
└── ...
```

### Namensschema

Benenne den Ordner nach dem Muster `JJJJ-MM-TT-kurz-beschreibung`:

- **Datum zuerst** (`JJJJ-MM-TT`), damit die Ordner chronologisch sortiert bleiben.
- Danach ein kurzer, sprechender Slug in Kleinbuchstaben mit Bindestrichen.

Beispiel: `2026-06-18-onboarding-flow`

### Pro Ordner

Jeder Demo-Ordner sollte für sich allein stehen und enthält idealerweise:

- ein eigenes kurzes `README.md`, das den Run beschreibt (Ziel, Setup, Ergebnis),
- alle für den Run nötigen Dateien/Skripte,
- bei Bedarf Screenshots oder Outputs.

## Warum?

So bleibt jeder Demo-Run isoliert, nachvollziehbar und reproduzierbar — ohne dass sich Runs gegenseitig überschreiben oder vermischen.
