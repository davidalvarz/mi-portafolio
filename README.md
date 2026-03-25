# 🚀 Mi Portfolio — Guía de instalación

Un portfolio personal moderno con dashboard de administración.

## ⚡ Instalación rápida

### 1. Requisitos previos
- **Node.js** v18 o superior → [nodejs.org](https://nodejs.org)
- **npm** (incluido con Node.js)

### 2. Instalar dependencias
```bash
cd mi-portfolio
npm install
```

### 3. Arrancar el servidor
```bash
npm start
```
O en modo desarrollo (reinicio automático):
```bash
npm run dev
```

### 4. Abrir en el navegador
- 🌐 **Portfolio público** → http://localhost:3000
- 🔧 **Dashboard** → http://localhost:3000/dashboard

---

## 🔑 Acceso al Dashboard

**Contraseña por defecto:** `admin2024`

> ⚠️ **Cámbiala** editando `server.js` línea 8:
> ```js
> const DASHBOARD_PASSWORD = 'tu-nueva-contraseña';
> ```

---

## 📝 Configurar tu información

### Opción A — Desde el Dashboard (recomendado)
1. Ve a http://localhost:3000/dashboard
2. Ingresa con la contraseña
3. Ve a **"Mi Perfil"** y llena todos los campos
4. En **"Proyectos"** agrega tus trabajos

### Opción B — Editando los archivos directamente
- **`data/profile.json`** → Tu información personal
- **`data/projects.json`** → Tus proyectos

---

## 📁 Estructura del proyecto

```
mi-portfolio/
├── server.js           ← Servidor Express (backend)
├── package.json
├── data/
│   ├── profile.json    ← Tu info personal (auto-generado)
│   └── projects.json   ← Tus proyectos (auto-generado)
└── public/
    ├── index.html      ← Portfolio público
    ├── dashboard.html  ← Panel de administración
    ├── css/
    │   ├── style.css       ← Estilos del portfolio
    │   └── dashboard.css   ← Estilos del dashboard
    ├── js/
    │   ├── main.js         ← Lógica del portfolio
    │   └── dashboard.js    ← Lógica del dashboard
    └── uploads/            ← Imágenes subidas (auto-creado)
```

---

## 🌐 ¿Dónde publicar tu portfolio? (Opciones gratuitas)

### 🥇 Recomendado: **Railway** (el más fácil para Node.js)
1. Sube tu proyecto a GitHub
2. Ve a [railway.app](https://railway.app)
3. Conecta tu repositorio
4. Deploy automático ✅
- **Ventaja**: Soporte nativo Node.js, persistencia de archivos

### 🥈 **Render** (muy popular, plan gratuito)
1. [render.com](https://render.com) → New Web Service
2. Conecta GitHub
3. Build: `npm install` | Start: `npm start`
- **Nota**: El plan gratuito duerme tras inactividad

### 🥉 **Fly.io** (potente, control total)
```bash
npm install -g flyctl
fly launch
fly deploy
```

### ⚡ **Vercel** (si migrás a Next.js en el futuro)
- Ideal si decides migrar el proyecto a Next.js/React

---

## 🎨 Personalización del diseño

Edita las variables CSS en `public/css/style.css`:
```css
:root {
  --accent: #C8FF47;  /* ← Color principal (lime ácido) */
  --bg:     #060810;  /* ← Fondo oscuro */
}
```

---

## 🔧 Variables de entorno (para producción)

Crea un archivo `.env`:
```
PORT=3000
DASHBOARD_PASSWORD=tu-contraseña-segura
```

E instala dotenv:
```bash
npm install dotenv
```

Agrega al inicio de `server.js`:
```js
require('dotenv').config();
const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || 'admin2024';
```
