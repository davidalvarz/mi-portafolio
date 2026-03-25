/* ═══════════════════════════════════════════════════
   DASHBOARD — dashboard.js
   Autenticación, CRUD proyectos, perfil
   ═══════════════════════════════════════════════════ */

const TOKEN_KEY = 'pf_token';
let token = localStorage.getItem(TOKEN_KEY) || '';
let allProjects = [];
let currentFilter = 'all';
let profileSkills = [];
let projectTechs   = [];
let pendingDeleteId = null;

// ── Auth ───────────────────────────────────────────────────────
async function checkAuth() {
  if (!token) return showLogin();
  try {
    const r = await fetch('/api/auth/verify', { method:'POST', headers:{ 'x-auth-token':token } });
    const d = await r.json();
    d.valid ? showDashboard() : showLogin();
  } catch { showLogin(); }
}

function showLogin()     { document.getElementById('loginScreen').classList.remove('hidden'); document.getElementById('dashboardApp').classList.add('hidden'); }
function showDashboard() { document.getElementById('loginScreen').classList.add('hidden');    document.getElementById('dashboardApp').classList.remove('hidden'); init(); }

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const pw = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');
  const btn   = document.getElementById('loginBtn');
  btn.textContent = 'Entrando...'; btn.disabled = true;
  try {
    const r = await fetch('/api/auth/login', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ password: pw })
    });
    const d = await r.json();
    if (d.success) {
      token = d.token; localStorage.setItem(TOKEN_KEY, token);
      errEl.classList.add('hidden'); showDashboard();
    } else {
      errEl.classList.remove('hidden');
    }
  } catch { errEl.textContent = 'Error de conexión'; errEl.classList.remove('hidden'); }
  btn.textContent = 'Entrar'; btn.disabled = false;
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  token = ''; localStorage.removeItem(TOKEN_KEY); showLogin();
});

// ── Sidebar tabs ───────────────────────────────────────────────
document.querySelectorAll('.sidebar__item[data-tab]').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.sidebar__item').forEach(i => i.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.add('hidden'));
    item.classList.add('active');
    document.getElementById(`tab-${item.dataset.tab}`).classList.remove('hidden');
    if (item.dataset.tab === 'profile') loadProfile();
  });
});

// ── Projects ───────────────────────────────────────────────────
async function loadProjects() {
  try {
    const r = await fetch('/api/projects', { headers:{ 'x-auth-token': token } });
    allProjects = await r.json();
    updateStats();
    renderTable(currentFilter);
  } catch(e) { toast('Error al cargar proyectos', 'error'); }
}

function updateStats() {
  document.getElementById('statTotal').textContent     = allProjects.length;
  document.getElementById('statPublished').textContent = allProjects.filter(p=>p.published).length;
  document.getElementById('statDraft').textContent     = allProjects.filter(p=>!p.published).length;
  document.getElementById('statFeatured').textContent  = allProjects.filter(p=>p.featured).length;
  document.getElementById('projCount').textContent     = `${allProjects.length} proyecto${allProjects.length !== 1 ? 's' : ''} en total`;
}

function renderTable(filter) {
  const list = allProjects.filter(p => {
    if (filter === 'published') return p.published;
    if (filter === 'draft')     return !p.published;
    if (filter === 'featured')  return p.featured;
    return true;
  });
  const wrap = document.getElementById('projectsTable');
  if (!list.length) {
    wrap.innerHTML = `<div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8M8 12h8"/></svg>
      <p>No hay proyectos en esta categoría</p>
      <button class="btn-primary" onclick="openDrawer()" style="width:auto">Crear primer proyecto</button>
    </div>`;
    return;
  }
  wrap.innerHTML = list.map(p => `
    <div class="proj-row" id="row-${p.id}">
      ${p.image
        ? `<img src="${p.image}" class="proj-row__thumb" alt="${p.title}" />`
        : `<div class="proj-row__thumb-placeholder"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>`
      }
      <div>
        <div class="proj-row__title">${p.title}</div>
        <div class="proj-row__desc">${p.description}</div>
      </div>
      <div class="proj-row__tech">
        ${(p.technologies||[]).slice(0,3).map(t=>`<span>${t}</span>`).join('')}
      </div>
      <div>
        ${p.published
          ? `<span class="badge badge--green">● Publicado</span>`
          : `<span class="badge badge--gray">○ Borrador</span>`
        }
      </div>
      <div>
        ${p.featured ? `<span class="badge badge--accent">★ Destacado</span>` : `<span class="badge badge--gray">Normal</span>`}
      </div>
      <div class="proj-row__actions">
        <button class="action-btn action-btn--toggle" title="${p.published?'Ocultar':'Publicar'}"
                onclick="togglePublish('${p.id}')">
          ${p.published ? 'Ocultar' : 'Publicar'}
        </button>
        <button class="action-btn action-btn--edit" title="Editar" onclick="openDrawer('${p.id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="action-btn action-btn--del" title="Eliminar" onclick="confirmDelete('${p.id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
        </button>
      </div>
    </div>
  `).join('');
}

// Filter buttons
document.querySelectorAll('.dash-filter').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.dash-filter').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderTable(currentFilter);
  });
});

// Add button
document.getElementById('addProjectBtn').addEventListener('click', () => openDrawer());

// Toggle publish
async function togglePublish(id) {
  const p = allProjects.find(x=>x.id===id);
  if (!p) return;
  const fd = new FormData();
  fd.append('published', String(!p.published));
  await apiFetch(`/api/projects/${id}`, 'PUT', fd);
  await loadProjects();
  toast(`Proyecto ${!p.published ? 'publicado' : 'ocultado'}`, 'success');
}

// Delete confirm
function confirmDelete(id) {
  const p = allProjects.find(x=>x.id===id);
  pendingDeleteId = id;
  document.getElementById('confirmTitle').textContent = `¿Eliminar "${p?.title}"?`;
  document.getElementById('confirmOverlay').classList.remove('hidden');
}
document.getElementById('confirmNo').addEventListener('click', () => {
  document.getElementById('confirmOverlay').classList.add('hidden');
  pendingDeleteId = null;
});
document.getElementById('confirmYes').addEventListener('click', async () => {
  document.getElementById('confirmOverlay').classList.add('hidden');
  if (!pendingDeleteId) return;
  await apiFetch(`/api/projects/${pendingDeleteId}`, 'DELETE');
  pendingDeleteId = null;
  await loadProjects();
  toast('Proyecto eliminado', 'success');
});

// ── Drawer (Add/Edit) ──────────────────────────────────────────
function openDrawer(id) {
  const isEdit = !!id;
  document.getElementById('drawerTitle').textContent = isEdit ? 'Editar proyecto' : 'Nuevo proyecto';
  document.getElementById('editProjectId').value = id || '';

  // Reset
  ['dTitle','dDesc','dLongDesc','dGithub','dLive'].forEach(f => document.getElementById(f).value = '');
  document.getElementById('dPublished').checked = false;
  document.getElementById('dFeatured').checked  = false;
  document.getElementById('dImgFile').value = '';
  document.getElementById('dImgPreview').classList.add('hidden');
  document.getElementById('imgPlaceholder').classList.remove('hidden');
  projectTechs = [];
  renderChips('dTechTags', projectTechs, removeProjectTech);

  if (isEdit) {
    const p = allProjects.find(x=>x.id===id);
    if (!p) return;
    document.getElementById('dTitle').value     = p.title || '';
    document.getElementById('dDesc').value      = p.description || '';
    document.getElementById('dLongDesc').value  = p.longDesc || '';
    document.getElementById('dGithub').value    = p.githubUrl || '';
    document.getElementById('dLive').value      = p.liveUrl || '';
    document.getElementById('dPublished').checked = !!p.published;
    document.getElementById('dFeatured').checked  = !!p.featured;
    if (p.image) {
      document.getElementById('dImgPreview').src = p.image;
      document.getElementById('dImgPreview').classList.remove('hidden');
      document.getElementById('imgPlaceholder').classList.add('hidden');
    }
    projectTechs = [...(p.technologies||[])];
    renderChips('dTechTags', projectTechs, removeProjectTech);
  }

  document.getElementById('drawerOverlay').classList.add('open');
  document.getElementById('drawer').classList.add('open');
  document.getElementById('dTitle').focus();
}

function closeDrawer() {
  document.getElementById('drawerOverlay').classList.remove('open');
  document.getElementById('drawer').classList.remove('open');
}
document.getElementById('drawerClose').addEventListener('click',  closeDrawer);
document.getElementById('drawerCancel').addEventListener('click', closeDrawer);
document.getElementById('drawerOverlay').addEventListener('click', closeDrawer);

// Image upload
document.getElementById('imgUploadArea').addEventListener('click', () => document.getElementById('dImgFile').click());
document.getElementById('dImgFile').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    document.getElementById('dImgPreview').src = ev.target.result;
    document.getElementById('dImgPreview').classList.remove('hidden');
    document.getElementById('imgPlaceholder').classList.add('hidden');
  };
  reader.readAsDataURL(file);
});

// Tech input
document.getElementById('dTechInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    const val = e.target.value.trim().replace(/,$/, '');
    if (val && !projectTechs.includes(val)) {
      projectTechs.push(val);
      renderChips('dTechTags', projectTechs, removeProjectTech);
    }
    e.target.value = '';
  }
});
function removeProjectTech(v) { projectTechs = projectTechs.filter(t=>t!==v); renderChips('dTechTags', projectTechs, removeProjectTech); }

// Save project
document.getElementById('drawerSave').addEventListener('click', async () => {
  const id    = document.getElementById('editProjectId').value;
  const title = document.getElementById('dTitle').value.trim();
  if (!title) { toast('El título es obligatorio', 'error'); return; }

  const fd = new FormData();
  fd.append('title',        title);
  fd.append('description',  document.getElementById('dDesc').value.trim());
  fd.append('longDesc',     document.getElementById('dLongDesc').value.trim());
  fd.append('githubUrl',    document.getElementById('dGithub').value.trim());
  fd.append('liveUrl',      document.getElementById('dLive').value.trim());
  fd.append('published',    document.getElementById('dPublished').checked.toString());
  fd.append('featured',     document.getElementById('dFeatured').checked.toString());
  fd.append('technologies', JSON.stringify(projectTechs));
  const file = document.getElementById('dImgFile').files[0];
  if (file) fd.append('image', file);

  const btn = document.getElementById('drawerSave');
  btn.textContent = 'Guardando...'; btn.disabled = true;

  try {
    if (id) await apiFetch(`/api/projects/${id}`, 'PUT', fd);
    else    await apiFetch('/api/projects', 'POST', fd);
    await loadProjects();
    closeDrawer();
    toast(id ? 'Proyecto actualizado ✓' : 'Proyecto creado ✓', 'success');
  } catch(e) { toast('Error al guardar', 'error'); }

  btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Guardar proyecto`;
  btn.disabled = false;
});

// ── Profile ────────────────────────────────────────────────────
async function loadProfile() {
  try {
    const r = await fetch('/api/profile');
    const d = await r.json();
    document.getElementById('pName').value     = d.name     || '';
    document.getElementById('pRole').value     = d.role     || '';
    document.getElementById('pBio').value      = d.bio      || '';
    document.getElementById('pEmail').value    = d.email    || '';
    document.getElementById('pLocation').value = d.location || '';
    document.getElementById('pCvUrl').value    = d.cvUrl    || '';
    document.getElementById('pGithub').value   = d.github   || '';
    document.getElementById('pLinkedin').value = d.linkedin || '';
    document.getElementById('pTwitter').value  = d.twitter  || '';
    profileSkills = [...(d.skills || [])];
    renderChips('skillsTags', profileSkills, removeProfileSkill);
    if (d.avatar) {
      const prev = document.getElementById('avatarPreview');
      prev.src = d.avatar; prev.classList.remove('hidden');
      document.getElementById('avatarPlaceholder').classList.add('hidden');
    }
  } catch { toast('Error al cargar perfil', 'error'); }
}

document.getElementById('avatarFile').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const prev = document.getElementById('avatarPreview');
    prev.src = ev.target.result; prev.classList.remove('hidden');
    document.getElementById('avatarPlaceholder').classList.add('hidden');
  };
  reader.readAsDataURL(file);
});

document.getElementById('skillsInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    const val = e.target.value.trim().replace(/,$/, '');
    if (val && !profileSkills.includes(val)) {
      profileSkills.push(val);
      renderChips('skillsTags', profileSkills, removeProfileSkill);
    }
    e.target.value = '';
  }
});
function removeProfileSkill(v) { profileSkills = profileSkills.filter(s=>s!==v); renderChips('skillsTags', profileSkills, removeProfileSkill); }

document.getElementById('saveProfileBtn').addEventListener('click', async () => {
  const fd = new FormData();
  fd.append('name',     document.getElementById('pName').value.trim());
  fd.append('role',     document.getElementById('pRole').value.trim());
  fd.append('bio',      document.getElementById('pBio').value.trim());
  fd.append('email',    document.getElementById('pEmail').value.trim());
  fd.append('location', document.getElementById('pLocation').value.trim());
  fd.append('cvUrl',    document.getElementById('pCvUrl').value.trim());
  fd.append('github',   document.getElementById('pGithub').value.trim());
  fd.append('linkedin', document.getElementById('pLinkedin').value.trim());
  fd.append('twitter',  document.getElementById('pTwitter').value.trim());
  fd.append('skills',   JSON.stringify(profileSkills));
  const avatarFile = document.getElementById('avatarFile').files[0];
  if (avatarFile) fd.append('avatar', avatarFile);
  try {
    await apiFetch('/api/profile', 'PUT', fd);
    toast('Perfil guardado ✓', 'success');
  } catch { toast('Error al guardar perfil', 'error'); }
});

// ── Helpers ────────────────────────────────────────────────────
function renderChips(containerId, items, onRemove) {
  const wrap = document.getElementById(containerId);
  wrap.innerHTML = items.map(v => `
    <span class="skill-chip">
      ${v}
      <button onclick="(${onRemove.toString()})('${v.replace(/'/g,"\\'")}')">✕</button>
    </span>
  `).join('');
}

async function apiFetch(url, method = 'GET', body = null) {
  const opts = { method, headers:{ 'x-auth-token': token } };
  if (body) opts.body = body;
  const r = await fetch(url, opts);
  if (!r.ok) {
    if (r.status === 401) { showLogin(); throw new Error('Unauthorized'); }
    throw new Error('API error');
  }
  return r.json();
}

let toastTimer;
function toast(msg, type = 'success') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast ${type}`;
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 3000);
}

// ── Init ───────────────────────────────────────────────────────
function init() { loadProjects(); }
checkAuth();
