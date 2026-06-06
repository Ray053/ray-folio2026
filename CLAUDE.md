# Portfolio 2026 — CLAUDE.md

UX 設計師個人作品集網站，包含 3D 互動 Hero、UX 專案展示、街舞影片頁、About 頁面，支援中英雙語與 Light/Dark mode。

---

## Tech Stack

| 層級 | 技術 |
|------|------|
| Framework | Next.js 15 (App Router) |
| CMS | Payload CMS v3（monorepo，同一個 Next.js app） |
| Database | MongoDB Atlas（免費 tier） |
| Deploy | Vercel |
| 3D | React Three Fiber (R3F) + Three.js |
| 動畫 | GSAP + ScrollTrigger |
| Styling | Tailwind CSS v4 + CSS custom properties |
| Components | shadcn/ui（客製化基底） |
| i18n | Payload localization（內容欄位）+ next-intl（UI 靜態文字） |
| 語言 | TypeScript |

---

## 頁面結構

### Routes
```
/                   → Home（Hero + UX Projects + Dance teaser）
/about              → About（照片 + 文字介紹）
/dance              → Dance（Instagram 風格影片頁）
/[locale]/...       → 語言前綴（zh / en）
/admin              → Payload CMS Studio
```

### Navbar
- Logo / 名字
- About（link）
- Download CV（button）
- 語言切換（zh ↔ en）
- Light / Dark mode toggle

### Footer
- 靜態個人聯絡資訊（email、社群連結）

---

## 頁面內容規劃

### Home
1. **Hero Section** — R3F noise blob（金屬冷灰藍）+ particle cursor，全版互動
2. **UX Projects Section（主角）** — 3 個專案，video card 互動：
   - 載入時靜態
   - 滑鼠移動 → card parallax（GSAP）
   - Hover → 影片播放
3. **Dance Teaser** — 低視覺權重，引導至 /dance 頁面

### Dance Page
- Instagram 風格，垂直影片 grid
- 4 支街舞影片
- 視覺權重低於 UX 專案

### About Page
- 個人照片 + 文字介紹
- 無技能列表或時間軸，保持簡潔

---

## CMS Schema（Payload CMS v3）

### Collections

**Projects**
```ts
{
  title: { type: 'text', localized: true },
  slug: { type: 'text', unique: true },
  description: { type: 'richText', localized: true },
  tags: { type: 'array', fields: [{ name: 'tag', type: 'text' }] },
  coverImage: { type: 'upload', relationTo: 'media' },
  video: { type: 'upload', relationTo: 'media' },
  liveUrl: { type: 'text' },
  year: { type: 'number' },
  featured: { type: 'checkbox' },
  order: { type: 'number' },
}
```

**DanceVideos**
```ts
{
  title: { type: 'text', localized: true },
  video: { type: 'upload', relationTo: 'media' },
  thumbnail: { type: 'upload', relationTo: 'media' },
  description: { type: 'textarea', localized: true },
  year: { type: 'number' },
  order: { type: 'number' },
}
```

### Globals

**SiteInfo**
```ts
{
  name: { type: 'text' },
  bio: { type: 'richText', localized: true },
  photo: { type: 'upload', relationTo: 'media' },
  email: { type: 'email' },
  github: { type: 'text' },
  linkedin: { type: 'text' },
  cvFile: { type: 'upload', relationTo: 'media' },
}
```

---

## i18n 架構

- **Payload localization**：管理所有內容欄位多語（title、description、bio 等）
- **next-intl**：管理靜態 UI 文字（nav labels、button text、section headings）
- 語言：`zh`（繁體中文，預設）、`en`（英文）

### next-intl 資料夾結構
```
messages/
  zh.json
  en.json
```

---

## 設計系統

### Color Tokens

**Neutral**
```
gray-0:   #FFFFFF
gray-50:  #FAFAFA
gray-100: #F5F5F5
gray-200: #E5E5E5
gray-300: #D4D4D4
gray-400: #A3A3A3
gray-500: #737373
gray-600: #525252
gray-700: #404040
gray-800: #262626
gray-900: #171717
gray-950: #0A0A0A
```

**Blue-Gray Accent（金屬冷灰藍）**
```
blue-100: #E8EDF2
blue-200: #C2D0DE
blue-300: #8AAABF
blue-400: #5C82A0   ← primary accent
blue-500: #3D6480   ← hover state
blue-600: #254A64   ← deep metallic
blue-700: #122333   ← darkest / blob shadow
```

**Noise Blob 漸層**
```
#0D1B2A → #1B3550 → #2E5F82 → #5C8FB0 → #A0C4D8 → highlight #D8E8F0
```

**Semantic Tokens**
```
                      Light Mode    Dark Mode
background            #FFFFFF       #0A0A0A
surface               #FAFAFA       #171717
surface-2             #F5F5F5       #262626
border                #E5E5E5       #262626
text-primary          #0A0A0A       #FAFAFA
text-secondary        #737373       #A3A3A3
text-muted            #A3A3A3       #525252
accent                #5C82A0       #8AAABF
accent-hover          #3D6480       #5C82A0
link                  #5C82A0       #8AAABF
link-hover            #3D6480       #A0C4D8
shadow-accent         rgba(92,130,160,0.25)  rgba(92,130,160,0.35)
```

### Typography

| 用途 | 字型 |
|------|------|
| Display / Heading（中文） | 探空體（TASA Typeface Collection） |
| Display / Heading（英文） | Syne |
| Body | Inter |
| Mono | Geist Mono |

**Type Scale**
```
text-xs:   12px  lh-1.5
text-sm:   14px  lh-1.5
text-base: 16px  lh-1.6
text-lg:   18px  lh-1.5
text-xl:   20px  lh-1.4
text-2xl:  24px  lh-1.3
text-3xl:  32px  lh-1.2
text-4xl:  48px  lh-1.1
text-5xl:  64px  lh-1.05
text-6xl:  80px  lh-1.0
```

**Font Weight**
```
regular:  400  → body
medium:   500  → label, nav
semibold: 600  → subheading
bold:     700  → display heading
```

### Spacing

4px 基準單位，沿用 Tailwind 預設 scale。

### Border Radius

```
radius-sm:   2px    → tag, badge
radius-md:   6px    → button, input
radius-lg:   12px   → card
radius-xl:   20px   → modal, panel
radius-full: 9999px → pill, avatar
```

### Motion Tokens（GSAP）

**Easing**
```
ease-out-expo:  "power4.out"      → 元素進場
ease-in-out:    "power2.inOut"    → 頁面過渡
ease-out-back:  "back.out(1.4)"   → 輕彈效果
ease-smooth:    "power1.inOut"    → ScrollTrigger scrub
```

**Duration**
```
fast:    0.15s  → hover state
base:    0.4s   → 一般過渡
slow:    0.7s   → 大型元素進場
slower:  1.2s   → hero 入場
scene:   2.0s   → 頁面切換
```

**ScrollTrigger 預設**
```
scrub: 1
start: "top 85%"
end:   "top 20%"
```

### Elevation / Shadow

```
shadow-sm:     0 1px 3px rgba(0,0,0,0.08)
shadow-md:     0 4px 16px rgba(0,0,0,0.12)
shadow-lg:     0 8px 32px rgba(0,0,0,0.16)
shadow-accent: 0 0 24px rgba(92,130,160,0.3)
```

---

## 資料夾結構（規劃中）

```
porfolio2026/
├── app/
│   ├── (frontend)/
│   │   ├── [locale]/
│   │   │   ├── page.tsx          → Home
│   │   │   ├── about/page.tsx
│   │   │   └── dance/page.tsx
│   ├── (payload)/
│   │   └── admin/[[...segments]]/
├── components/
│   ├── ui/                       → shadcn/ui base components
│   ├── three/                    → R3F components（NoiseBlob, ParticleCursor）
│   ├── sections/                 → page sections
│   └── layout/                   → Navbar, Footer
├── lib/
│   ├── tokens.ts                 → design tokens
│   └── motion.ts                 → GSAP constants
├── messages/
│   ├── zh.json
│   └── en.json
├── payload/
│   ├── collections/
│   └── globals/
├── public/
│   └── fonts/                    → 探空體 font files
└── tailwind.config.ts
```

---

## 開發注意事項

- 所有動畫在 `prefers-reduced-motion` 下應降級為靜態
- Three.js / R3F 元件用 `dynamic import` + `ssr: false` 避免 SSR 錯誤
- 探空體字型用 `next/font/local` 載入
- Dark mode 透過 CSS custom properties 切換，不用 JS 重渲染
- Payload CMS 在同一個 Next.js app 內，route 為 `/admin`
