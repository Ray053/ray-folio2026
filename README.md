# Portfolio 2026

UX designer portfolio with a liquid-metal 3D hero, webcam hand-tracking, and CMS-driven content. Built with Next.js 16 and Payload CMS.

🔗 **Live:** <https://ray-folio2026.vercel.app>

---

## ✨ Features

- **R3F hero** — animated iridescent noise-blob (custom GLSL shaders) with particle cursor and impact splinters
- **Webcam hand interaction** — MediaPipe hand tracking: the blob follows your hand, a **fist freezes the flow**, and a **pinch splits it into up to five blobs**
- **Scroll storytelling** — Lenis smooth scroll + GSAP/ScrollTrigger: parallax, text colour-fill reveals, a continuous trajectory ball linking sections, and velocity-reactive marquees
- **UX work** — full-width accordion with a cursor-following cover preview; bento layout on the dedicated work page
- **Dance page** — Instagram-style bento grid, hover-to-play video
- **CMS-driven** — Payload CMS manages projects, dance videos, and site info (bio, photo, contacts, CV)
- **i18n** — Traditional Chinese / English via next-intl (`/` and `/en`)
- **Light / Dark mode**, theme-aware logo & favicon, full `prefers-reduced-motion` support
- **Performance** — R3F render loop pauses when the hero scrolls out of view

---

## 🧱 Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router) |
| CMS | Payload CMS v3 (same Next.js app) |
| Database | MongoDB Atlas |
| 3D | React Three Fiber + Three.js |
| Motion | GSAP + ScrollTrigger, Lenis |
| Hand tracking | MediaPipe Tasks Vision |
| Styling | Tailwind CSS v4 + CSS custom properties |
| i18n | next-intl |
| Storage | Vercel Blob (production media) |
| Deploy | Vercel |
| Language | TypeScript |

---

## 🚀 Getting Started

```bash
# 1. Install
npm install

# 2. Configure environment
cp .env.example .env.local
# then fill in DATABASE_URI and PAYLOAD_SECRET

# 3. Run
npm run dev
```

- App: <http://localhost:3000>
- Admin (Payload CMS): <http://localhost:3000/admin>

### Environment variables

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URI` | ✅ | MongoDB Atlas connection string |
| `PAYLOAD_SECRET` | ✅ | 32+ char random string (`openssl rand -hex 32`) |
| `BLOB_READ_WRITE_TOKEN` | prod | Vercel Blob token; omit locally to use disk storage |

---

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint |

---

## 📁 Structure

```
app/
  (frontend)/[locale]/   → Home, About, Work, Dance pages
  (payload)/             → Payload admin + REST API
components/
  three/                 → R3F (noise blob, splinters, trail, hand morph)
  sections/              → page sections
  ui/                    → reusable UI + interactions
  layout/                → Navbar, Footer
lib/                     → Payload helpers, hand gestures, motion tokens
payload/                 → collections & globals
messages/                → next-intl translations
```

---

## ☁️ Deployment

Deployed on Vercel. Media is stored in Vercel Blob; MongoDB Atlas hosts the database. Pushing to `main` triggers GitHub Actions (typecheck + lint + build) and a Vercel deploy.
