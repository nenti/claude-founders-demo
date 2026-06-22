const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// --- In-Memory-Datenbank (kein Setup nötig) ---
let ideas = [
  { id: 1, title: 'Dark Mode einbauen', description: 'Ein dunkles Design wäre toll für abendliche Nutzung.', author: 'Anna', likes: 5, createdAt: new Date().toISOString() },
  { id: 2, title: 'Mobile App', description: 'Das Board auch als native App für iOS und Android.', author: 'Ben', likes: 12, createdAt: new Date().toISOString() },
  { id: 3, title: 'Export als PDF', description: 'Alle Ideen am Ende des Kurses als PDF exportieren.', author: 'Lena', likes: 2, createdAt: new Date().toISOString() },
];
let nextId = 4;

// --- Routen ---

// GET /api/ideas — alle Ideen zurückgeben (nach Likes sortiert)
app.get('/api/ideas', (req, res) => {
  const sorted = [...ideas].sort((a, b) => b.likes - a.likes);
  res.json(sorted);
});

// POST /api/ideas — neue Idee einreichen
app.post('/api/ideas', (req, res) => {
  const { title, description, author } = req.body;

  if (!title || !author) {
    return res.status(400).json({ error: 'Titel und Name sind Pflichtfelder.' });
  }

  const idea = {
    id: nextId++,
    title,
    description: description || '',
    author,
    likes: 0,
    createdAt: new Date().toISOString(),
  };

  ideas.push(idea);
  res.status(201).json(idea);
});

// POST /api/ideas/:id/like — für eine Idee abstimmen
app.post('/api/ideas/:id/like', (req, res) => {
  const id = parseInt(req.params.id);
  const idea = ideas.find(i => i.id === id);

  if (!idea) {
    return res.status(404).json({ error: 'Idee nicht gefunden.' });
  }

  idea.likes += 1;
  res.json(idea);
});

// --- Server starten ---
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\nIdeen-Board Backend läuft auf http://localhost:${PORT}`);
  console.log('Endpunkte:');
  console.log(`  GET  http://localhost:${PORT}/api/ideas`);
  console.log(`  POST http://localhost:${PORT}/api/ideas`);
  console.log(`  POST http://localhost:${PORT}/api/ideas/:id/like\n`);
});
