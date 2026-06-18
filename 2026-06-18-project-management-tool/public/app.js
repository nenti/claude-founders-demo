'use strict';

// ---------------------------------------------------------------------------
// Tiny helpers
// ---------------------------------------------------------------------------
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const el = (tag, attrs = {}, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') n.className = v;
    else if (k === 'html') n.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined) n.setAttribute(k, v);
  }
  for (const kid of kids.flat()) {
    if (kid == null) continue;
    n.appendChild(typeof kid === 'string' ? document.createTextNode(kid) : kid);
  }
  return n;
};
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const api = async (method, url, body) => {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText);
  return res.json();
};

function toast(msg) {
  const t = el('div', { class: 'toast' }, msg);
  $('#toastRoot').appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 250); }, 2600);
}

function timeAgo(iso) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return 'just now';
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const STATUSES = [
  { key: 'backlog', label: 'Backlog', color: '#969db0' },
  { key: 'todo', label: 'To Do', color: '#3b82f6' },
  { key: 'in_progress', label: 'In Progress', color: '#f59e0b' },
  { key: 'review', label: 'Review', color: '#818cf8' },
  { key: 'done', label: 'Done', color: '#10b981' },
];
const DEC_STATUSES = ['proposed', 'accepted', 'rejected', 'superseded'];

let state = null;
let currentProject = null;
let currentView = 'overview';

const memberById = (uid) => (state.team.find((m) => m.id === uid)) || null;
const projTasks = () => state.tasks.filter((t) => t.projectId === currentProject);
const projDecisions = () => state.decisions.filter((d) => d.projectId === currentProject);
const projDocs = () => state.docs.filter((d) => d.projectId === currentProject);

async function refresh() {
  state = await api('GET', '/api/state');
  if (!currentProject || !state.projects.find((p) => p.id === currentProject)) {
    currentProject = state.projects[0] && state.projects[0].id;
  }
  renderProjectPicker();
  render();
}

// ---------------------------------------------------------------------------
// Project picker + nav
// ---------------------------------------------------------------------------
function renderProjectPicker() {
  const sel = $('#projectSelect');
  sel.innerHTML = '';
  state.projects.forEach((p) => sel.appendChild(el('option', { value: p.id }, p.name)));
  sel.value = currentProject;
  sel.onchange = () => { currentProject = sel.value; render(); };
}

$$('#nav .nav-item').forEach((b) =>
  b.addEventListener('click', () => {
    currentView = b.dataset.view;
    $$('#nav .nav-item').forEach((x) => x.classList.toggle('active', x === b));
    render();
  })
);

// ---------------------------------------------------------------------------
// Render dispatch
// ---------------------------------------------------------------------------
const TITLES = {
  overview: ['Overview', 'Health, progress, and what needs attention'],
  board: ['Board', 'Drag tasks across stages to move work forward'],
  decisions: ['Decisions', 'A clear, durable record of what was decided and why'],
  docs: ['Docs', 'Living documentation that stays with the project'],
  team: ['Team & Activity', 'Who is involved and what just happened'],
};

function render() {
  const [title, sub] = TITLES[currentView];
  $('#viewTitle').textContent = title;
  $('#viewSubtitle').textContent = sub;
  $('#topbarActions').innerHTML = '';
  const root = $('#viewRoot');
  root.innerHTML = '';
  ({ overview: renderOverview, board: renderBoard, decisions: renderDecisions, docs: renderDocs, team: renderTeam }[currentView])(root);
}

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------
function renderOverview(root) {
  const tasks = projTasks();
  const done = tasks.filter((t) => t.status === 'done').length;
  const inProg = tasks.filter((t) => t.status === 'in_progress').length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const openDecisions = projDecisions().filter((d) => d.status === 'proposed').length;

  const cards = el('div', { class: 'cards' },
    statCard('Progress', `${pct}%`, `${done} of ${tasks.length} tasks done`),
    statCard('In Progress', String(inProg), 'active right now'),
    statCard('Open Decisions', String(openDecisions), 'awaiting a call'),
    statCard('Docs', String(projDocs().length), 'in the knowledge base'),
  );
  root.appendChild(cards);

  // progress by stage
  root.appendChild(el('div', { class: 'section-title' }, 'Work by stage'));
  const segs = STATUSES.map((s) => {
    const n = tasks.filter((t) => t.status === s.key).length;
    return { ...s, n };
  });
  const total = tasks.length || 1;
  const bar = el('div', { class: 'bar' });
  segs.forEach((s) => { if (s.n) bar.appendChild(el('span', { style: `width:${(s.n / total) * 100}%;background:${s.color}` })); });
  const legend = el('div', { style: 'display:flex;gap:18px;flex-wrap:wrap;margin-top:12px;font-size:13px;color:var(--muted)' },
    ...segs.map((s) => el('span', {}, el('span', { style: `display:inline-block;width:9px;height:9px;border-radius:50%;background:${s.color};margin-right:6px` }), `${s.label} · ${s.n}`)));
  root.appendChild(el('div', { class: 'card' }, bar, legend));

  // recent activity preview
  root.appendChild(el('div', { class: 'section-title' }, 'Recent activity'));
  root.appendChild(activityFeed(state.activity.slice(0, 5)));
}

function statCard(k, v, sub) {
  return el('div', { class: 'card stat' },
    el('div', { class: 'k' }, k),
    el('div', { class: 'v' }, v),
    el('div', { class: 'sub' }, sub));
}

// ---------------------------------------------------------------------------
// Board (kanban with drag & drop)
// ---------------------------------------------------------------------------
function renderBoard(root) {
  $('#topbarActions').appendChild(el('button', { class: 'btn btn-primary', onclick: () => openTaskModal() }, '+ New task'));
  const board = el('div', { class: 'board' });
  STATUSES.forEach((s) => {
    const tasks = projTasks().filter((t) => t.status === s.key);
    const col = el('div', { class: 'col', 'data-status': s.key });
    col.appendChild(el('div', { class: 'col-head' },
      el('div', { class: 'title' }, el('span', { style: `width:9px;height:9px;border-radius:50%;background:${s.color}` }), s.label),
      el('span', { class: 'col-count' }, String(tasks.length))));
    tasks.forEach((t) => col.appendChild(taskCard(t)));

    col.addEventListener('dragover', (e) => { e.preventDefault(); col.classList.add('drag-over'); });
    col.addEventListener('dragleave', () => col.classList.remove('drag-over'));
    col.addEventListener('drop', async (e) => {
      e.preventDefault();
      col.classList.remove('drag-over');
      const taskId = e.dataTransfer.getData('text/plain');
      const task = state.tasks.find((t) => t.id === taskId);
      if (task && task.status !== s.key) {
        await api('PATCH', `/api/tasks/${taskId}`, { status: s.key });
        await refresh();
        toast(`Moved to ${s.label}`);
      }
    });
    board.appendChild(col);
  });
  root.appendChild(board);
}

function taskCard(t) {
  const m = memberById(t.assignee);
  const card = el('div', { class: 'task', draggable: 'true', onclick: () => openTaskModal(t) },
    el('div', { class: 't-title' }, t.title),
    el('div', { class: 't-meta' },
      el('span', { class: `pill ${t.priority}` }, t.priority),
      m ? el('div', { class: 'avatar', title: m.name }, m.initials) : el('div', { class: 'avatar' }, '–')));
  card.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', t.id); card.classList.add('dragging'); });
  card.addEventListener('dragend', () => card.classList.remove('dragging'));
  return card;
}

// ---------------------------------------------------------------------------
// Decisions
// ---------------------------------------------------------------------------
function renderDecisions(root) {
  $('#topbarActions').appendChild(el('button', { class: 'btn btn-primary', onclick: () => openDecisionModal() }, '+ Log decision'));
  const items = projDecisions();
  if (!items.length) { root.appendChild(el('div', { class: 'empty' }, 'No decisions logged yet. Capture the next call your team makes.')); return; }
  const list = el('div', { class: 'list' });
  items.forEach((d) => {
    const deciders = (d.deciders || []).map((u) => (memberById(u) || {}).name).filter(Boolean).join(', ');
    list.appendChild(el('div', { class: 'row-card' },
      el('div', { class: 'row-head' },
        el('h3', {}, d.title),
        el('span', { class: `badge ${d.status}` }, d.status)),
      el('div', { class: 'kv' },
        el('div', { class: 'k' }, 'Context'), el('div', {}, d.context || '—'),
        el('div', { class: 'k' }, 'Decision'), el('div', {}, d.decision || '—'),
        el('div', { class: 'k' }, 'Consequences'), el('div', {}, d.consequences || '—'),
        el('div', { class: 'k' }, 'Deciders'), el('div', {}, deciders || '—'),
        el('div', { class: 'k' }, 'Date'), el('div', {}, new Date(d.date).toLocaleDateString())),
      el('div', { style: 'margin-top:14px;display:flex;gap:8px' },
        el('button', { class: 'btn btn-sm', onclick: () => openDecisionModal(d) }, 'Edit'),
        el('button', { class: 'btn btn-sm btn-ghost', onclick: () => deleteThing('decisions', d.id) }, 'Delete'))));
  });
  root.appendChild(list);
}

// ---------------------------------------------------------------------------
// Docs
// ---------------------------------------------------------------------------
function renderDocs(root) {
  $('#topbarActions').appendChild(el('button', { class: 'btn btn-primary', onclick: () => openDocModal() }, '+ New doc'));
  const items = projDocs();
  if (!items.length) { root.appendChild(el('div', { class: 'empty' }, 'No docs yet. Write the brief, the runbook, the decisions that need prose.')); return; }
  const list = el('div', { class: 'list' });
  items.forEach((d) => {
    list.appendChild(el('div', { class: 'row-card' },
      el('div', { class: 'row-head' },
        el('h3', {}, d.title),
        el('span', { class: 'muted', style: 'margin:0' }, `updated ${timeAgo(d.updatedAt)}`)),
      el('div', { class: 'body', style: 'margin-top:10px' }, d.body || ''),
      el('div', { style: 'margin-top:14px;display:flex;gap:8px' },
        el('button', { class: 'btn btn-sm', onclick: () => openDocModal(d) }, 'Edit'),
        el('button', { class: 'btn btn-sm btn-ghost', onclick: () => deleteThing('docs', d.id) }, 'Delete'))));
  });
  root.appendChild(list);
}

// ---------------------------------------------------------------------------
// Team & Activity
// ---------------------------------------------------------------------------
function renderTeam(root) {
  root.appendChild(el('div', { class: 'section-title' }, 'Team'));
  const grid = el('div', { class: 'team-grid' });
  state.team.forEach((m) => {
    const load = state.tasks.filter((t) => t.assignee === m.id && t.status !== 'done').length;
    grid.appendChild(el('div', { class: 'card member' },
      el('div', { class: 'avatar' }, m.initials),
      el('div', {},
        el('div', { style: 'font-weight:600' }, m.name),
        el('div', { class: 'muted', style: 'margin:2px 0 0' }, `${m.role} · ${load} open`))));
  });
  root.appendChild(grid);
  root.appendChild(el('div', { class: 'section-title' }, 'Activity'));
  root.appendChild(activityFeed(state.activity.slice(0, 30)));
}

function activityFeed(items) {
  if (!items.length) return el('div', { class: 'empty' }, 'Nothing here yet.');
  const feed = el('div', { class: 'feed' });
  const ICONS = { task: '▦', decision: '✦', doc: '▤', project: '◎' };
  items.forEach((a) => {
    feed.appendChild(el('div', { class: 'feed-item' },
      el('div', { class: `ic ${a.type}` }, ICONS[a.type] || '•'),
      el('div', {}, el('div', {}, a.message), el('div', { class: 'when' }, timeAgo(a.ts)))));
  });
  return feed;
}

// ---------------------------------------------------------------------------
// Modals
// ---------------------------------------------------------------------------
function closeModal() { $('#modalRoot').innerHTML = ''; }
function modal(title, bodyNodes, onSave, saveLabel = 'Save') {
  const body = el('div', { class: 'modal-body' }, ...bodyNodes);
  const m = el('div', { class: 'modal-backdrop', onclick: (e) => { if (e.target === m) closeModal(); } },
    el('div', { class: 'modal' },
      el('div', { class: 'modal-head' }, el('h2', {}, title), el('button', { class: 'btn btn-ghost btn-sm', onclick: closeModal }, '✕')),
      body,
      el('div', { class: 'modal-foot' },
        el('button', { class: 'btn', onclick: closeModal }, 'Cancel'),
        el('button', { class: 'btn btn-primary', onclick: () => onSave() }, saveLabel))));
  $('#modalRoot').appendChild(m);
}

function field(label, input) { return el('div', { class: 'field' }, el('label', {}, label), input); }
function input(value = '', attrs = {}) { return el('input', { value, ...attrs }); }
function textarea(value = '') { const t = el('textarea', {}); t.value = value; return t; }
function selectFrom(options, value) {
  const s = el('select', {});
  options.forEach((o) => { const opt = el('option', { value: o.value }, o.label); if (o.value === value) opt.selected = true; s.appendChild(opt); });
  return s;
}

function openTaskModal(task) {
  const isEdit = !!task;
  const tTitle = input(task ? task.title : '');
  const tDesc = textarea(task ? task.description : '');
  const tStatus = selectFrom(STATUSES.map((s) => ({ value: s.key, label: s.label })), task ? task.status : 'backlog');
  const tPriority = selectFrom(['high', 'medium', 'low'].map((p) => ({ value: p, label: p })), task ? task.priority : 'medium');
  const tAssignee = selectFrom([{ value: '', label: 'Unassigned' }, ...state.team.map((m) => ({ value: m.id, label: m.name }))], task ? task.assignee : '');
  const nodes = [
    field('Title', tTitle),
    field('Description', tDesc),
    el('div', { class: 'row2' }, field('Status', tStatus), field('Priority', tPriority)),
    field('Assignee', tAssignee),
  ];
  if (isEdit) nodes.push(el('button', { class: 'btn btn-sm btn-ghost', onclick: () => deleteThing('tasks', task.id) }, 'Delete task'));
  modal(isEdit ? 'Edit task' : 'New task', nodes, async () => {
    const payload = { projectId: currentProject, title: tTitle.value.trim(), description: tDesc.value, status: tStatus.value, priority: tPriority.value, assignee: tAssignee.value || null };
    if (!payload.title) return toast('Title is required');
    if (isEdit) await api('PATCH', `/api/tasks/${task.id}`, payload);
    else await api('POST', '/api/tasks', payload);
    closeModal(); await refresh(); toast(isEdit ? 'Task updated' : 'Task created');
  });
}

function openDecisionModal(dec) {
  const isEdit = !!dec;
  const dTitle = input(dec ? dec.title : '');
  const dContext = textarea(dec ? dec.context : '');
  const dDecision = textarea(dec ? dec.decision : '');
  const dCons = textarea(dec ? dec.consequences : '');
  const dStatus = selectFrom(DEC_STATUSES.map((s) => ({ value: s, label: s })), dec ? dec.status : 'proposed');
  modal(isEdit ? 'Edit decision' : 'Log a decision', [
    field('Title', dTitle),
    field('Context — what forced this choice?', dContext),
    field('Decision — what we chose', dDecision),
    field('Consequences — the trade-off we accept', dCons),
    field('Status', dStatus),
  ], async () => {
    const payload = { projectId: currentProject, title: dTitle.value.trim(), context: dContext.value, decision: dDecision.value, consequences: dCons.value, status: dStatus.value };
    if (!payload.title) return toast('Title is required');
    if (isEdit) await api('PATCH', `/api/decisions/${dec.id}`, payload);
    else await api('POST', '/api/decisions', payload);
    closeModal(); await refresh(); toast('Decision saved');
  });
}

function openDocModal(doc) {
  const isEdit = !!doc;
  const dTitle = input(doc ? doc.title : '');
  const dBody = textarea(doc ? doc.body : '');
  dBody.style.minHeight = '220px';
  modal(isEdit ? 'Edit doc' : 'New doc', [field('Title', dTitle), field('Body (Markdown welcome)', dBody)], async () => {
    const payload = { projectId: currentProject, title: dTitle.value.trim(), body: dBody.value };
    if (!payload.title) return toast('Title is required');
    if (isEdit) await api('PATCH', `/api/docs/${doc.id}`, payload);
    else await api('POST', '/api/docs', payload);
    closeModal(); await refresh(); toast('Doc saved');
  });
}

async function deleteThing(resource, itemId) {
  if (!confirm('Delete this item?')) return;
  await api('DELETE', `/api/${resource}/${itemId}`);
  closeModal(); await refresh(); toast('Deleted');
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
refresh().catch((e) => {
  document.body.innerHTML = `<div style="padding:40px;font-family:sans-serif;color:#e7eaf0">Failed to load: ${esc(e.message)}</div>`;
});
