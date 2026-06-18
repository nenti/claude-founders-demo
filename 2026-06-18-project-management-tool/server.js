'use strict';

/*
 * AlignHQ — zero-dependency Node.js server.
 *
 * Serves a single-page project management app plus a small JSON REST API.
 * State lives in memory, seeded on boot, and is persisted best-effort to a
 * JSON file so a graceful restart keeps your data. (On Nyxory the pod
 * filesystem is ephemeral, so a fresh pod re-seeds the demo data.)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const DATA_DIR = process.env.DATA_DIR || __dirname;
const DATA_FILE = path.join(DATA_DIR, 'data.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

const id = () => crypto.randomBytes(8).toString('hex');
const now = () => new Date().toISOString();

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------
function seed() {
  const p1 = 'proj-apollo';
  const p2 = 'proj-orbit';
  const team = [
    { id: 'u1', name: 'Tobias R.', role: 'Founder / PM', initials: 'TR' },
    { id: 'u2', name: 'Mara Lindqvist', role: 'Engineering Lead', initials: 'ML' },
    { id: 'u3', name: 'Devon Park', role: 'Design', initials: 'DP' },
    { id: 'u4', name: 'Sasha Okoro', role: 'Backend', initials: 'SO' },
  ];
  const projects = [
    { id: p1, name: 'Apollo — Customer Portal', description: 'Self-serve portal launch for enterprise customers.', color: '#6366f1' },
    { id: p2, name: 'Orbit — Billing Revamp', description: 'Usage-based billing and invoicing overhaul.', color: '#10b981' },
  ];
  const tasks = [
    { id: id(), projectId: p1, title: 'Define portal information architecture', description: 'Top-level nav + page map.', status: 'done', assignee: 'u3', priority: 'high', createdAt: now(), updatedAt: now() },
    { id: id(), projectId: p1, title: 'Auth & SSO integration', description: 'SAML + OIDC support for enterprise tenants.', status: 'in_progress', assignee: 'u4', priority: 'high', createdAt: now(), updatedAt: now() },
    { id: id(), projectId: p1, title: 'Dashboard widgets v1', description: 'Usage, invoices, support tickets.', status: 'todo', assignee: 'u2', priority: 'medium', createdAt: now(), updatedAt: now() },
    { id: id(), projectId: p1, title: 'Accessibility pass (WCAG AA)', description: 'Audit and fix contrast + keyboard nav.', status: 'backlog', assignee: 'u3', priority: 'medium', createdAt: now(), updatedAt: now() },
    { id: id(), projectId: p1, title: 'Beta feedback synthesis', description: 'Cluster feedback from 12 design partners.', status: 'review', assignee: 'u1', priority: 'low', createdAt: now(), updatedAt: now() },
    { id: id(), projectId: p2, title: 'Metering pipeline', description: 'Ingest usage events into aggregation store.', status: 'in_progress', assignee: 'u4', priority: 'high', createdAt: now(), updatedAt: now() },
    { id: id(), projectId: p2, title: 'Invoice PDF rendering', description: 'Templated, branded invoices.', status: 'todo', assignee: 'u2', priority: 'medium', createdAt: now(), updatedAt: now() },
    { id: id(), projectId: p2, title: 'Proration rules', description: 'Mid-cycle plan changes.', status: 'backlog', assignee: 'u4', priority: 'medium', createdAt: now(), updatedAt: now() },
  ];
  const decisions = [
    { id: id(), projectId: p1, title: 'Adopt OIDC as the primary SSO protocol', context: 'Enterprise customers split between SAML and OIDC. We must support both but lead with one.', decision: 'Lead with OIDC for new integrations; keep SAML as a supported fallback for legacy IdPs.', consequences: 'Faster onboarding for modern IdPs; SAML kept behind a feature flag.', status: 'accepted', date: now(), deciders: ['u1', 'u2', 'u4'] },
    { id: id(), projectId: p1, title: 'Server-render the dashboard shell', context: 'Time-to-first-meaningful-paint is poor on the SPA-only prototype.', decision: 'Render the shell + first widget server-side, hydrate the rest.', consequences: 'Better perceived performance; slightly more complex deploy.', status: 'proposed', date: now(), deciders: ['u2', 'u3'] },
    { id: id(), projectId: p2, title: 'Use event-sourced metering', context: 'Billing accuracy disputes are expensive. We need an auditable trail.', decision: 'Store raw usage events immutably; derive aggregates downstream.', consequences: 'Full auditability and replay; more storage, needs compaction.', status: 'accepted', date: now(), deciders: ['u1', 'u4'] },
  ];
  const docs = [
    { id: id(), projectId: p1, title: 'Apollo — Product Brief', body: '# Apollo Portal\n\n**Goal:** give enterprise customers a self-serve home for usage, invoices, and support.\n\n## Success metrics\n- 60% of support tickets deflected via self-serve\n- < 2s time-to-interactive on the dashboard\n\n## Out of scope (v1)\n- Native mobile apps\n- White-label theming', updatedAt: now() },
    { id: id(), projectId: p1, title: 'Onboarding runbook', body: '# Enterprise onboarding\n\n1. Provision tenant\n2. Configure SSO (OIDC preferred)\n3. Invite admins\n4. Verify SSO round-trip\n5. Enable dashboard widgets', updatedAt: now() },
    { id: id(), projectId: p2, title: 'Orbit — Billing model', body: '# Usage-based billing\n\nUsage events → metering pipeline → aggregates → invoices.\n\n- **Plans:** Starter, Growth, Scale\n- **Proration:** by the second, applied at cycle close\n- **Disputes:** resolved against the immutable event log', updatedAt: now() },
  ];
  const activity = [
    { id: id(), type: 'decision', message: 'Decision accepted: Adopt OIDC as the primary SSO protocol', ts: now() },
    { id: id(), type: 'task', message: 'Mara moved “Auth & SSO integration” to In Progress', ts: now() },
    { id: id(), type: 'doc', message: 'Devon updated “Apollo — Product Brief”', ts: now() },
  ];
  return { projects, tasks, decisions, docs, team, activity };
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------
let db;
function load() {
  try {
    db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    if (!db || !Array.isArray(db.projects)) throw new Error('bad shape');
    console.log('Loaded state from', DATA_FILE);
  } catch (e) {
    db = seed();
    console.log('Seeded fresh demo state');
    save();
  }
}
let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
    } catch (e) {
      console.warn('Could not persist state:', e.message);
    }
  }, 150);
}

function logActivity(type, message) {
  db.activity.unshift({ id: id(), type, message, ts: now() });
  db.activity = db.activity.slice(0, 100);
}

const memberName = (uid) => (db.team.find((m) => m.id === uid) || {}).name || 'Someone';

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------
function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => {
      data += c;
      if (data.length > 1e6) reject(new Error('payload too large'));
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try { resolve(JSON.parse(data)); } catch (e) { reject(new Error('invalid JSON')); }
    });
    req.on('error', reject);
  });
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
};

function serveStatic(req, res, urlPath) {
  let rel = urlPath === '/' ? '/index.html' : urlPath;
  const filePath = path.normalize(path.join(PUBLIC_DIR, rel));
  if (!filePath.startsWith(PUBLIC_DIR)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(filePath, (err, content) => {
    if (err) {
      // SPA fallback
      fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (e2, html) => {
        if (e2) { res.writeHead(404); return res.end('Not found'); }
        res.writeHead(200, { 'Content-Type': MIME['.html'] });
        res.end(html);
      });
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(content);
  });
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------
function findOr404(res, arr, itemId) {
  const item = arr.find((x) => x.id === itemId);
  if (!item) { sendJson(res, 404, { error: 'not found' }); return null; }
  return item;
}

async function handleApi(req, res, segs) {
  const [, , resource, itemId] = ['', ...segs.map((s) => s)]; // segs already begins after /api
  const name = segs[1];
  const target = segs[2];
  const method = req.method;

  if (name === 'health') return sendJson(res, 200, { ok: true, time: now() });
  if (name === 'state' && method === 'GET') return sendJson(res, 200, db);

  // Projects
  if (name === 'projects') {
    if (method === 'GET') return sendJson(res, 200, db.projects);
    if (method === 'POST') {
      const b = await readBody(req);
      if (!b.name) return sendJson(res, 400, { error: 'name required' });
      const proj = { id: 'proj-' + id(), name: b.name, description: b.description || '', color: b.color || '#6366f1' };
      db.projects.push(proj);
      logActivity('project', `New project created: ${proj.name}`);
      save();
      return sendJson(res, 201, proj);
    }
  }

  // Tasks
  if (name === 'tasks') {
    if (method === 'POST') {
      const b = await readBody(req);
      if (!b.title) return sendJson(res, 400, { error: 'title required' });
      const task = {
        id: id(), projectId: b.projectId, title: b.title, description: b.description || '',
        status: b.status || 'backlog', assignee: b.assignee || null, priority: b.priority || 'medium',
        createdAt: now(), updatedAt: now(),
      };
      db.tasks.push(task);
      logActivity('task', `New task: “${task.title}”`);
      save();
      return sendJson(res, 201, task);
    }
    if (target && (method === 'PATCH' || method === 'PUT')) {
      const task = findOr404(res, db.tasks, target);
      if (!task) return;
      const b = await readBody(req);
      const prevStatus = task.status;
      ['title', 'description', 'status', 'assignee', 'priority'].forEach((k) => {
        if (b[k] !== undefined) task[k] = b[k];
      });
      task.updatedAt = now();
      if (b.status && b.status !== prevStatus) {
        logActivity('task', `${memberName(task.assignee)} moved “${task.title}” to ${labelStatus(b.status)}`);
      }
      save();
      return sendJson(res, 200, task);
    }
    if (target && method === 'DELETE') {
      const i = db.tasks.findIndex((t) => t.id === target);
      if (i === -1) return sendJson(res, 404, { error: 'not found' });
      const [removed] = db.tasks.splice(i, 1);
      logActivity('task', `Task deleted: “${removed.title}”`);
      save();
      return sendJson(res, 200, { ok: true });
    }
  }

  // Decisions
  if (name === 'decisions') {
    if (method === 'POST') {
      const b = await readBody(req);
      if (!b.title) return sendJson(res, 400, { error: 'title required' });
      const dec = {
        id: id(), projectId: b.projectId, title: b.title, context: b.context || '',
        decision: b.decision || '', consequences: b.consequences || '',
        status: b.status || 'proposed', date: now(), deciders: b.deciders || [],
      };
      db.decisions.push(dec);
      logActivity('decision', `Decision logged: ${dec.title} (${dec.status})`);
      save();
      return sendJson(res, 201, dec);
    }
    if (target && (method === 'PATCH' || method === 'PUT')) {
      const dec = findOr404(res, db.decisions, target);
      if (!dec) return;
      const b = await readBody(req);
      const prevStatus = dec.status;
      ['title', 'context', 'decision', 'consequences', 'status', 'deciders'].forEach((k) => {
        if (b[k] !== undefined) dec[k] = b[k];
      });
      if (b.status && b.status !== prevStatus) {
        logActivity('decision', `Decision “${dec.title}” → ${labelDecision(b.status)}`);
      }
      save();
      return sendJson(res, 200, dec);
    }
    if (target && method === 'DELETE') {
      const i = db.decisions.findIndex((d) => d.id === target);
      if (i === -1) return sendJson(res, 404, { error: 'not found' });
      db.decisions.splice(i, 1);
      save();
      return sendJson(res, 200, { ok: true });
    }
  }

  // Docs
  if (name === 'docs') {
    if (method === 'POST') {
      const b = await readBody(req);
      if (!b.title) return sendJson(res, 400, { error: 'title required' });
      const doc = { id: id(), projectId: b.projectId, title: b.title, body: b.body || '', updatedAt: now() };
      db.docs.push(doc);
      logActivity('doc', `New doc: “${doc.title}”`);
      save();
      return sendJson(res, 201, doc);
    }
    if (target && (method === 'PATCH' || method === 'PUT')) {
      const doc = findOr404(res, db.docs, target);
      if (!doc) return;
      const b = await readBody(req);
      ['title', 'body'].forEach((k) => { if (b[k] !== undefined) doc[k] = b[k]; });
      doc.updatedAt = now();
      logActivity('doc', `Doc updated: “${doc.title}”`);
      save();
      return sendJson(res, 200, doc);
    }
    if (target && method === 'DELETE') {
      const i = db.docs.findIndex((d) => d.id === target);
      if (i === -1) return sendJson(res, 404, { error: 'not found' });
      db.docs.splice(i, 1);
      save();
      return sendJson(res, 200, { ok: true });
    }
  }

  return sendJson(res, 404, { error: 'unknown endpoint' });
}

function labelStatus(s) {
  return ({ backlog: 'Backlog', todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' })[s] || s;
}
function labelDecision(s) {
  return ({ proposed: 'Proposed', accepted: 'Accepted', rejected: 'Rejected', superseded: 'Superseded' })[s] || s;
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------
load();

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const segs = url.pathname.split('/').filter(Boolean); // e.g. ['api','tasks','id']

  if (segs[0] === 'api') {
    handleApi(req, res, segs).catch((err) => {
      sendJson(res, 400, { error: err.message || 'bad request' });
    });
    return;
  }
  serveStatic(req, res, url.pathname);
});

server.listen(PORT, HOST, () => {
  console.log(`AlignHQ listening on http://${HOST}:${PORT}`);
});
