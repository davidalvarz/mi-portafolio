const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Config ─────────────────────────────────────────────────────────────────
const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || 'admin2024';
const DATA_DIR     = path.join(__dirname, 'data');
const UPLOADS_DIR  = path.join(__dirname, 'data', 'uploads'); // ← dentro de /data (un solo volumen)
const PROJECTS_F   = path.join(DATA_DIR, 'projects.json');
const PROFILE_F    = path.join(DATA_DIR, 'profile.json');

// Crear directorios si no existen
[DATA_DIR, UPLOADS_DIR].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

// Servir imágenes desde data/uploads bajo la ruta /uploads
app.use('/uploads', express.static(UPLOADS_DIR));

// ─── Helpers ─────────────────────────────────────────────────────────────────
const read  = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const write = (f, d) => fs.writeFileSync(f, JSON.stringify(d, null, 2));

// Inicializar archivos de datos si no existen
if (!fs.existsSync(PROJECTS_F)) write(PROJECTS_F, []);
if (!fs.existsSync(PROFILE_F)) write(PROFILE_F, {
  name: "Tu Nombre",
  role: "Desarrollador Full Stack",
  bio: "Apasionado por crear experiencias digitales únicas. Especializado en desarrollo web moderno con enfoque en rendimiento y diseño.",
  email: "tu@email.com",
  location: "Tu Ciudad, País",
  avatar: "",
  github: "tu-usuario-github",
  linkedin: "tu-perfil-linkedin",
  twitter: "",
  cvUrl: "",
  skills: ["JavaScript", "React", "Node.js", "Python", "CSS", "Git"]
});

// ─── Multer ───────────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOADS_DIR),
  filename:    (_, file, cb) => cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    cb(null, allowed.test(file.mimetype) && allowed.test(path.extname(file.originalname).toLowerCase()));
  }
});

// ─── Auth ─────────────────────────────────────────────────────────────────────
const TOKEN = Buffer.from(DASHBOARD_PASSWORD).toString('base64');

app.post('/api/auth/login', (req, res) => {
  if (req.body.password === DASHBOARD_PASSWORD) {
    res.json({ success: true, token: TOKEN });
  } else {
    res.status(401).json({ error: 'Contraseña incorrecta' });
  }
});

app.post('/api/auth/verify', (req, res) => {
  res.json({ valid: req.headers['x-auth-token'] === TOKEN });
});

const auth = (req, res, next) => {
  if (req.headers['x-auth-token'] === TOKEN) return next();
  res.status(401).json({ error: 'No autorizado' });
};

// ─── Proyectos API ─────────────────────────────────────────────────────────────
app.get('/api/projects', (req, res) => {
  const all = read(PROJECTS_F);
  const isAdmin = req.headers['x-auth-token'] === TOKEN;
  res.json(isAdmin ? all : all.filter(p => p.published));
});

app.post('/api/projects', auth, upload.single('image'), (req, res) => {
  const list = read(PROJECTS_F);
  const p = {
    id:           Date.now().toString(),
    title:        req.body.title       || 'Sin título',
    description:  req.body.description || '',
    longDesc:     req.body.longDesc    || '',
    technologies: JSON.parse(req.body.technologies || '[]'),
    githubUrl:    req.body.githubUrl   || '',
    liveUrl:      req.body.liveUrl     || '',
    image:        req.file ? `/uploads/${req.file.filename}` : '',
    published:    req.body.published === 'true',
    featured:     req.body.featured   === 'true',
    order:        list.length,
    createdAt:    new Date().toISOString()
  };
  list.push(p);
  write(PROJECTS_F, list);
  res.status(201).json(p);
});

app.put('/api/projects/:id', auth, upload.single('image'), (req, res) => {
  const list = read(PROJECTS_F);
  const i = list.findIndex(p => p.id === req.params.id);
  if (i === -1) return res.status(404).json({ error: 'Proyecto no encontrado' });

  const updated = { ...list[i],
    title:        req.body.title        !== undefined ? req.body.title        : list[i].title,
    description:  req.body.description  !== undefined ? req.body.description  : list[i].description,
    longDesc:     req.body.longDesc     !== undefined ? req.body.longDesc     : list[i].longDesc,
    technologies: req.body.technologies !== undefined ? JSON.parse(req.body.technologies) : list[i].technologies,
    githubUrl:    req.body.githubUrl    !== undefined ? req.body.githubUrl    : list[i].githubUrl,
    liveUrl:      req.body.liveUrl      !== undefined ? req.body.liveUrl      : list[i].liveUrl,
    published:    req.body.published    !== undefined ? req.body.published === 'true' : list[i].published,
    featured:     req.body.featured     !== undefined ? req.body.featured  === 'true' : list[i].featured,
    updatedAt:    new Date().toISOString()
  };
  if (req.file) updated.image = `/uploads/${req.file.filename}`;
  list[i] = updated;
  write(PROJECTS_F, list);
  res.json(updated);
});

app.delete('/api/projects/:id', auth, (req, res) => {
  const list  = read(PROJECTS_F);
  const found = list.find(p => p.id === req.params.id);
  if (found?.image?.startsWith('/uploads/')) {
    const fp = path.join(UPLOADS_DIR, path.basename(found.image));
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
  }
  write(PROJECTS_F, list.filter(p => p.id !== req.params.id));
  res.json({ success: true });
});

// Reordenar proyectos
app.post('/api/projects/reorder', auth, (req, res) => {
  const { ids } = req.body;
  const list = read(PROJECTS_F);
  const reordered = ids.map((id, i) => {
    const p = list.find(x => x.id === id);
    if (p) p.order = i;
    return p;
  }).filter(Boolean);
  write(PROJECTS_F, reordered);
  res.json({ success: true });
});

// ─── Perfil API ────────────────────────────────────────────────────────────────
app.get('/api/profile', (_, res) => res.json(read(PROFILE_F)));

app.put('/api/profile', auth, upload.single('avatar'), (req, res) => {
  const profile = read(PROFILE_F);
  const updated = { ...profile, ...req.body };
  if (req.body.skills)       updated.skills      = JSON.parse(req.body.skills);
  if (req.body.socialLinks)  updated.socialLinks = JSON.parse(req.body.socialLinks);
  if (req.file) updated.avatar = `/uploads/${req.file.filename}`;
  write(PROFILE_F, updated);
  res.json(updated);
});

// ─── Dashboard route ───────────────────────────────────────────────────────────
app.get('/dashboard', (_, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));

// ─── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n✅  Portfolio corriendo en → http://localhost:${PORT}`);
  console.log(`🔧  Dashboard en          → http://localhost:${PORT}/dashboard`);
  console.log(`🔑  Contraseña dashboard  → ${DASHBOARD_PASSWORD}\n`);
});
