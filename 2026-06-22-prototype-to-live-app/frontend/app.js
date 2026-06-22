const API = '/api';

const grid     = document.getElementById('grid');
const countEl  = document.getElementById('count');
const errorMsg = document.getElementById('error-msg');
const form     = document.getElementById('idea-form');

// --- Ideen laden und anzeigen ---
async function loadIdeas() {
  try {
    const res  = await fetch(`${API}/ideas`);
    const data = await res.json();

    errorMsg.classList.add('hidden');
    renderIdeas(data);
  } catch {
    errorMsg.classList.remove('hidden');
    grid.innerHTML = '';
  }
}

function renderIdeas(ideas) {
  countEl.textContent = `${ideas.length} ${ideas.length === 1 ? 'Idee' : 'Ideen'}`;

  if (ideas.length === 0) {
    grid.innerHTML = '<div class="loading">Noch keine Ideen — sei der Erste!</div>';
    return;
  }

  grid.innerHTML = ideas.map(idea => `
    <div class="idea-card" data-id="${idea.id}">
      <h3>${escapeHtml(idea.title)}</h3>
      ${idea.description ? `<p>${escapeHtml(idea.description)}</p>` : '<p></p>'}
      <div class="meta">
        <span class="author">von ${escapeHtml(idea.author)}</span>
        <button class="like-btn" onclick="likeIdea(${idea.id}, this)">
          ❤️ ${idea.likes}
        </button>
      </div>
    </div>
  `).join('');
}

// --- Für Idee abstimmen ---
async function likeIdea(id, btn) {
  btn.disabled = true;

  try {
    const res  = await fetch(`${API}/ideas/${id}/like`, { method: 'POST' });
    const idea = await res.json();

    btn.textContent = `❤️ ${idea.likes}`;
    btn.classList.add('liked');
  } catch {
    alert('Abstimmung fehlgeschlagen. Versuche es erneut.');
  } finally {
    btn.disabled = false;
  }
}

// --- Neue Idee einreichen ---
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Wird eingereicht…';

  const body = {
    author:      document.getElementById('author').value.trim(),
    title:       document.getElementById('title').value.trim(),
    description: document.getElementById('description').value.trim(),
  };

  try {
    await fetch(`${API}/ideas`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });

    form.reset();
    await loadIdeas();
  } catch {
    alert('Idee konnte nicht eingereicht werden. Ist das Backend gestartet?');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Idee einreichen';
  }
});

// XSS-Schutz: HTML-Sonderzeichen escapen
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Start
loadIdeas();
