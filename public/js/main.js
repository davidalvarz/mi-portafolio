/* ═══════════════════════════════════════════════════
   PORTFOLIO — main.js
   Animaciones, cursor, typewriter, GitHub, API
   ═══════════════════════════════════════════════════ */

// ── Custom Cursor ──────────────────────────────────────────────
const cursor    = document.getElementById('cursor');
const cursorDot = document.getElementById('cursorDot');
let mouseX = 0, mouseY = 0;
let curX = 0, curY = 0;

document.addEventListener('mousemove', e => {
  mouseX = e.clientX; mouseY = e.clientY;
  cursorDot.style.left = mouseX + 'px';
  cursorDot.style.top  = mouseY + 'px';
});
function animateCursor() {
  curX += (mouseX - curX) * .12;
  curY += (mouseY - curY) * .12;
  cursor.style.left = curX + 'px';
  cursor.style.top  = curY + 'px';
  requestAnimationFrame(animateCursor);
}
animateCursor();

// ── Navbar scroll ──────────────────────────────────────────────
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 30);
});

// ── Mobile menu ────────────────────────────────────────────────
const burger     = document.getElementById('navBurger');
const mobileMenu = document.getElementById('mobileMenu');
burger.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('open');
  burger.querySelectorAll('span')[0].style.transform = open ? 'rotate(45deg) translate(4px,4px)' : '';
  burger.querySelectorAll('span')[1].style.opacity   = open ? '0' : '';
  burger.querySelectorAll('span')[2].style.transform = open ? 'rotate(-45deg) translate(4px,-4px)' : '';
});
document.querySelectorAll('.mobile-link').forEach(l => l.addEventListener('click', () => {
  mobileMenu.classList.remove('open');
}));

// ── Reveal on scroll ───────────────────────────────────────────
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
}, { threshold: .1, rootMargin: '0px 0px -40px 0px' });

function initReveal() {
  document.querySelectorAll('.reveal').forEach((el, i) => {
    el.style.transitionDelay = (i % 5) * 80 + 'ms';
    io.observe(el);
  });
}

// ── Text Scramble ──────────────────────────────────────────────
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&';
function scramble(el, finalText, duration = 800) {
  let start = null;
  const len = finalText.length;
  function step(ts) {
    if (!start) start = ts;
    const prog = Math.min((ts - start) / duration, 1);
    const revealedCount = Math.floor(prog * len);
    let out = '';
    for (let i = 0; i < len; i++) {
      if (i < revealedCount) {
        out += finalText[i];
      } else {
        out += finalText[i] === ' ' ? ' ' : CHARS[Math.floor(Math.random() * CHARS.length)];
      }
    }
    el.textContent = out;
    if (prog < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ── Typewriter ─────────────────────────────────────────────────
const roles = [
  'Desarrollador Full Stack',
  'UI / UX Enthusiast',
  'Arquitecto de Software',
  'Creador de Experiencias',
];
let roleIdx = 0, charIdx = 0, deleting = false;
const typeEl = document.getElementById('typewriter');
function typeLoop() {
  const current = roles[roleIdx];
  if (!deleting) {
    typeEl.textContent = current.slice(0, ++charIdx);
    if (charIdx === current.length) { setTimeout(() => { deleting = true; typeLoop(); }, 2200); return; }
  } else {
    typeEl.textContent = current.slice(0, --charIdx);
    if (charIdx === 0) { deleting = false; roleIdx = (roleIdx + 1) % roles.length; }
  }
  setTimeout(typeLoop, deleting ? 50 : 90);
}
typeLoop();

// ── Load Profile ───────────────────────────────────────────────
async function loadProfile() {
  try {
    const res  = await fetch('/api/profile');
    const data = await res.json();

    // Hero
    const nameEl = document.getElementById('heroName');
    if (nameEl) scramble(nameEl, (data.name || 'Tu Nombre').toUpperCase(), 1000);
    document.getElementById('heroBio').textContent = data.bio || '';
    document.title = `${data.name || 'Portfolio'} — Dev`;

    // Nav logo initials
    const initials = (data.name || 'Dev').split(' ').map(w=>w[0]).join('').slice(0,2).toLowerCase();
    document.getElementById('navLogo').innerHTML = `${initials}<span>.</span>`;
    document.getElementById('footerLogo').innerHTML = `${initials}<span>.</span>`;
    document.getElementById('footerCopy').textContent = `© ${new Date().getFullYear()} ${data.name || ''} — Hecho con ☕ y código`;

    // CV
    if (data.cvUrl) document.getElementById('cvBtn').href = data.cvUrl;
    else document.getElementById('cvBtn').style.display = 'none';

    // About section
    if (data.avatar) {
      const img = document.getElementById('aboutImg');
      img.src = data.avatar;
      img.classList.remove('hidden');
      document.getElementById('aboutImgPlaceholder').classList.add('hidden');
    }
    if (data.location) document.getElementById('aboutLocation').textContent = '📍 ' + data.location;
    document.getElementById('aboutBio').textContent = data.bio || '';

    // About info rows
    const infoEl = document.getElementById('aboutInfo');
    const infoRows = [
      { label: 'Email',    value: `<a href="mailto:${data.email}">${data.email || ''}</a>` },
      { label: 'Ubicación', value: data.location || '' },
      { label: 'GitHub',   value: data.github ? `<a href="https://github.com/${data.github}" target="_blank">@${data.github}</a>` : '' },
    ].filter(r => r.value);
    infoEl.innerHTML = infoRows.map(r =>
      `<div class="about__info-row"><span class="about__info-label">${r.label}</span><span class="about__info-value">${r.value}</span></div>`
    ).join('');

    // Skills
    const skillsEl = document.getElementById('skillsGrid');
    skillsEl.innerHTML = (data.skills || []).map(s => `<span class="skill-tag">${s}</span>`).join('');

    // Social links hero
    buildSocials(data);

    // Contact
    document.getElementById('contactEmail').innerHTML =
      `¿Tienes un proyecto en mente? Escríbeme a <a href="mailto:${data.email}" style="color:var(--accent)">${data.email}</a> y lo hacemos realidad.`;

    buildContactSocials(data);

    // Load GitHub if username set
    if (data.github && data.github !== 'tu-usuario') loadGitHub(data.github);
    else document.querySelector('.github-section').style.display = 'none';

  } catch (e) { console.error('Profile error', e); }
}

function buildSocials(data) {
  const wrap = document.getElementById('heroSocials');
  const links = [];
  if (data.github)   links.push({ href: `https://github.com/${data.github}`, icon: githubIcon() });
  if (data.linkedin) links.push({ href: `https://linkedin.com/in/${data.linkedin}`, icon: linkedinIcon() });
  if (data.twitter)  links.push({ href: `https://twitter.com/${data.twitter}`, icon: twitterIcon() });
  if (data.email)    links.push({ href: `mailto:${data.email}`, icon: emailIcon() });
  wrap.innerHTML = links.map(l => `<a href="${l.href}" target="_blank" class="social-link">${l.icon}</a>`).join('');
}

function buildContactSocials(data) {
  const wrap = document.getElementById('contactSocials');
  const btns = [];
  if (data.github)   btns.push({ href:`https://github.com/${data.github}`,        icon: githubIcon(),   label:'GitHub' });
  if (data.linkedin) btns.push({ href:`https://linkedin.com/in/${data.linkedin}`, icon: linkedinIcon(), label:'LinkedIn' });
  if (data.twitter)  btns.push({ href:`https://twitter.com/${data.twitter}`,       icon: twitterIcon(),  label:'Twitter' });
  wrap.innerHTML = btns.map(b =>
    `<a href="${b.href}" target="_blank" class="contact-social-btn">${b.icon} ${b.label}</a>`
  ).join('');
}

// ── Load Projects ──────────────────────────────────────────────
let allProjects = [];
async function loadProjects() {
  try {
    const res  = await fetch('/api/projects');
    allProjects = await res.json();
    renderProjects(allProjects);
    buildFilters(allProjects);
  } catch (e) { console.error('Projects error', e); }
}

function renderProjects(list) {
  const grid  = document.getElementById('projectsGrid');
  const empty = document.getElementById('projectsEmpty');
  if (!list.length) { grid.innerHTML = ''; empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');

  grid.innerHTML = list.map(p => `
    <div class="project-card reveal ${p.featured ? 'featured' : ''}" data-id="${p.id}"
         onclick="openModal('${p.id}')" style="cursor:pointer">
      ${p.image
        ? `<img src="${p.image}" alt="${p.title}" class="project-card__image" loading="lazy" />`
        : `<div class="project-card__img-placeholder">${placeholderSVG()}</div>`
      }
      <div class="project-card__body">
        <h3 class="project-card__title">${p.title}</h3>
        <p class="project-card__desc">${p.description}</p>
        <div class="project-card__tags">
          ${(p.technologies || []).slice(0,4).map(t => `<span class="tech-tag">${t}</span>`).join('')}
        </div>
        <div class="project-card__links" onclick="event.stopPropagation()">
          <span class="project-link project-link--main">Ver detalles →</span>
          ${p.githubUrl ? `<a href="${p.githubUrl}" target="_blank" class="project-link">${githubIcon(14)} Código</a>` : ''}
          ${p.liveUrl   ? `<a href="${p.liveUrl}"   target="_blank" class="project-link">${externalIcon()} Live</a>` : ''}
        </div>
      </div>
    </div>
  `).join('');

  // Re-observe new reveal elements
  grid.querySelectorAll('.reveal').forEach((el, i) => {
    el.style.transitionDelay = (i % 4) * 100 + 'ms';
    io.observe(el);
  });
}

function buildFilters(list) {
  const techs = [...new Set(list.flatMap(p => p.technologies || []))].slice(0, 8);
  const wrap  = document.getElementById('projectFilters');
  const extra = techs.map(t =>
    `<button class="filter-btn" data-filter="${t}">${t}</button>`
  ).join('');
  wrap.innerHTML = `<button class="filter-btn active" data-filter="all">Todos</button>` + extra;

  wrap.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      wrap.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.dataset.filter;
      renderProjects(f === 'all' ? allProjects : allProjects.filter(p => (p.technologies || []).includes(f)));
    });
  });
}

// ── Project Modal ──────────────────────────────────────────────
function openModal(id) {
  const p = allProjects.find(x => x.id === id);
  if (!p) return;
  const content = document.getElementById('modalContent');
  content.innerHTML = `
    ${p.image ? `<img src="${p.image}" alt="${p.title}" class="modal__img" />` : ''}
    <h2 class="modal__title">${p.title}</h2>
    <div class="modal__tags">
      ${(p.technologies || []).map(t => `<span class="tech-tag">${t}</span>`).join('')}
    </div>
    <p class="modal__desc">${p.longDesc || p.description}</p>
    <div class="modal__links">
      ${p.githubUrl ? `<a href="${p.githubUrl}" target="_blank" class="btn btn--outline">${githubIcon(14)} Ver código</a>` : ''}
      ${p.liveUrl   ? `<a href="${p.liveUrl}"   target="_blank" class="btn btn--primary">${externalIcon()} Ver en vivo</a>` : ''}
    </div>
  `;
  document.getElementById('projectModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('projectModal').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
function closeModal() {
  document.getElementById('projectModal').classList.remove('open');
  document.body.style.overflow = '';
}

// ── GitHub ─────────────────────────────────────────────────────
async function loadGitHub(username) {
  try {
    const [userRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${username}`),
      fetch(`https://api.github.com/users/${username}/repos?sort=stars&per_page=6`)
    ]);
    if (!userRes.ok) { document.querySelector('.github-section').style.display = 'none'; return; }
    const user  = await userRes.json();
    const repos = await reposRes.json();

    document.getElementById('githubProfile').innerHTML = `
      <div class="gh-profile-card">
        <img src="${user.avatar_url}" alt="${user.login}" class="gh-avatar" />
        <h3 class="gh-name">${user.name || user.login}</h3>
        <p class="gh-username">@${user.login}</p>
        ${user.bio ? `<p class="gh-bio">${user.bio}</p>` : ''}
        <div class="gh-stats">
          <div class="gh-stat"><span class="gh-stat-n">${user.public_repos}</span><span class="gh-stat-l">Repos</span></div>
          <div class="gh-stat"><span class="gh-stat-n">${user.followers}</span><span class="gh-stat-l">Seguidores</span></div>
          <div class="gh-stat"><span class="gh-stat-n">${user.following}</span><span class="gh-stat-l">Siguiendo</span></div>
        </div>
        <a href="${user.html_url}" target="_blank" class="gh-link">${githubIcon(14)} Ver perfil</a>
      </div>
    `;

    const reposHtml = repos.filter(r => !r.fork).slice(0,4).map(r => `
      <div class="gh-repo-card">
        <div class="gh-repo-name"><a href="${r.html_url}" target="_blank">${r.name}</a></div>
        <p class="gh-repo-desc">${r.description || 'Sin descripción'}</p>
        <div class="gh-repo-meta">
          ${r.language ? `<span><span class="gh-lang-dot" style="background:${langColor(r.language)}"></span>${r.language}</span>` : ''}
          <span>⭐ ${r.stargazers_count}</span>
          <span>🍴 ${r.forks_count}</span>
        </div>
      </div>
    `).join('');
    document.getElementById('githubRepos').innerHTML = `<div class="gh-repos-grid">${reposHtml}</div>`;
    document.querySelectorAll('#githubGrid .reveal').forEach(el => io.observe(el));
  } catch (e) {
    document.querySelector('.github-section').style.display = 'none';
  }
}

function langColor(lang) {
  const map = { JavaScript:'#f1e05a', TypeScript:'#3178c6', Python:'#3572A5',
                CSS:'#563d7c', HTML:'#e34c26', Java:'#b07219', Go:'#00ADD8',
                Rust:'#dea584', PHP:'#4F5D95', Ruby:'#701516' };
  return map[lang] || '#C8FF47';
}

// ── Contact Form ───────────────────────────────────────────────
document.getElementById('contactForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const name  = document.getElementById('formName').value;
  const email = document.getElementById('formEmail').value;
  const msg   = document.getElementById('formMsg').value;
  const prof  = await fetch('/api/profile').then(r=>r.json()).catch(()=>({email:''}));
  const mailTo = `mailto:${prof.email}?subject=Contacto de ${name}&body=${encodeURIComponent(`Nombre: ${name}\nEmail: ${email}\n\n${msg}`)}`;
  window.location.href = mailTo;
});

// ── SVG Icons ──────────────────────────────────────────────────
function githubIcon(s=18) {
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>`;
}
function linkedinIcon(s=18) {
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`;
}
function twitterIcon(s=18) {
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`;
}
function emailIcon(s=18) {
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`;
}
function externalIcon(s=14) {
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;
}
function placeholderSVG() {
  return `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
}

// ── Init ───────────────────────────────────────────────────────
(async () => {
  await loadProfile();
  await loadProjects();
  initReveal();
})();
