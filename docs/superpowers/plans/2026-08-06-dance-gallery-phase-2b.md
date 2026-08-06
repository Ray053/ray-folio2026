# 3D Dance Circle-Gallery — Phase 2b Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the home Dance section with a pinned 3D circle-gallery: dance-video planes orbit on a cylinder around the Phase-2a particle ball (true depth — planes pass behind the ball), scroll drives the rotation, the front-facing plane enlarges and plays its video, and the `/dance` sub-page is removed.

**Architecture:** A tall pinned DOM section `DanceGallery` (`#dance-zone`, ~320vh with a sticky 100vh inner) provides the scroll length + title UI + a static fallback grid. The fixed-canvas `JourneyBall` gains a `DanceCylinder` (R3F planes with image/video textures) rendered in the SAME scene as the particle ball, so depth-occlusion is real. The `JourneyBall` controller computes a `dancePin` progress from the `#dance-zone` rect, centres the (particle) ball in the viewport during the pin, rotates the cylinder, and the cylinder plays only the front plane's video.

**Tech Stack:** React Three Fiber / Three.js (`PlaneGeometry`, `TextureLoader`, `VideoTexture`), GSAP (existing), Payload (dance-videos). No new deps.

## Global Constraints

- Design source: `docs/superpowers/specs/2026-08-06-particle-ball-dance-gallery-design.md` (Phase 2b). Builds on Phase 2a (particle ball morph in `JourneyBall`, `#dance-zone`).
- **One R3F scene:** cylinder planes + particle ball share the journey canvas + z-buffer → planes rotating behind the ball are occluded.
- **Only the front plane plays video** (`VideoTexture`); the rest show a paused thumbnail texture. `lowPower` → all thumbnails, front plays.
- Palette: bauhaus chrome around it stays electric-blue/lime/ink; plane frames use a 2px ink border look (via a thin border plane or texture inset). No dark mode.
- **a11y:** `prefers-reduced-motion` OR no-WebGL → the cylinder does not run; `DanceGallery` shows a **static hard-block grid** of the videos (playable), particle ball static. Never trap scroll (the pin is a tall-section + sticky, so normal scrolling always advances).
- Motion: transform/opacity/shader-uniform/scene-rotation only.
- Remove `/dance` route, `DancePage`, `DanceVideoCard`, `DanceTeaser` (Task 5) — no dead links.

---

### Task 1: Shared `getDanceVideos` (`lib/payload.ts`)

Extract the dance-videos fetch (currently inline in the `/dance` page) into a reusable loader so the home page can feed the gallery.

**Files:**
- Modify: `lib/payload.ts`
- Reference: `app/(frontend)/[locale]/dance/page.tsx` (existing fetch to copy)

**Interfaces:**
- Produces:
  - `type DanceVideo = { id: string; title: string; year: number; location?: string; videoSrc?: string; thumbnailSrc?: string }`
  - `getDanceVideos(locale: string): Promise<DanceVideo[]>` — payload `find('dance-videos', { depth:1, limit:24, sort:'order', locale })`, mapped; returns `[]` on error.

- [ ] **Step 1: Implement the loader**

In `lib/payload.ts`, add the `DanceVideo` type and:
```ts
export async function getDanceVideos(locale: string): Promise<DanceVideo[]> {
  try {
    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'dance-videos', depth: 1, limit: 24, sort: 'order',
      locale: locale as 'zh' | 'en',
    })
    return docs.map((d: any) => ({
      id: String(d.id),
      title: typeof d.title === 'string' ? d.title : '',
      year: typeof d.year === 'number' ? d.year : new Date().getFullYear(),
      location: d.location ?? '',
      videoSrc: urlOf(d.video),
      thumbnailSrc: urlOf(d.thumbnail),
    }))
  } catch {
    return []
  }
}
```
(Use the file's existing `getPayload`/`config`/`urlOf` helpers; match the mapping in the `/dance` page. If `urlOf`/`config` imports aren't present in `lib/payload.ts`, add them as the `/dance` page has them.)

- [ ] **Step 2: Typecheck & lint**

Run: `npx tsc --noEmit ; npm run lint` (expect clean).

- [ ] **Step 3: Commit**

```bash
git add lib/payload.ts
git commit -m "Add shared getDanceVideos loader"
```

---

### Task 2: Feed dance items to the journey canvas (home `page.tsx`, `JourneyBallMount`, `JourneyBall`)

Fetch dance videos on the home page and thread them through the mount into `JourneyBall` (which will build the cylinder in Task 4) and into `DanceGallery` (Task 3).

**Files:**
- Modify: `app/(frontend)/[locale]/page.tsx`
- Modify: `components/three/JourneyBallMount.tsx`
- Modify: `components/three/JourneyBall.tsx`

**Interfaces:**
- `JourneyBallMount` gains `danceItems?: DanceVideo[]`; `JourneyBall` gains `danceItems?: DanceVideo[]` (stored, passed to `DanceCylinder` in Task 4).

- [ ] **Step 1: Fetch + pass on the home page**

In `app/(frontend)/[locale]/page.tsx`: import `getDanceVideos`, fetch alongside the existing `getProjects`/`getSiteInfo` (`const [projects, site, dance] = await Promise.all([...])`), and pass `danceItems={dance}` to `<JourneyBallMount />`. (The `DanceGallery` section added in Task 3 will also receive `dance`.)

- [ ] **Step 2: Thread through the mount**

`JourneyBallMount` accepts `danceItems` and passes it to `<JourneyBall danceItems={danceItems} lowPower={lowPower} />`.

- [ ] **Step 3: Accept in JourneyBall (store for Task 4)**

`JourneyBall` accepts `danceItems?: DanceVideo[]` (default `[]`). No rendering change yet — Task 4 renders the cylinder from it. Import the `DanceVideo` type from `@/lib/payload`.

- [ ] **Step 4: Typecheck, lint**

Run: `npx tsc --noEmit ; npm run lint` (expect clean).

- [ ] **Step 5: Commit**

```bash
git add "app/(frontend)/[locale]/page.tsx" components/three/JourneyBallMount.tsx components/three/JourneyBall.tsx
git commit -m "Thread dance items into the journey canvas"
```

---

### Task 3: `DanceGallery` pinned section + static fallback (replaces `DanceTeaser`)

The tall pinned DOM section that owns `#dance-zone`, provides the scroll length for the cylinder rotation, renders the bauhaus title UI, and a static hard-block grid fallback of the videos (shown for reduced-motion / no-WebGL). The 3D cylinder + ball render over it from the fixed canvas.

**Files:**
- Create: `components/sections/DanceGallery.tsx`
- Modify: `app/(frontend)/[locale]/page.tsx` (swap `DanceTeaser` → `DanceGallery`)

**Interfaces:**
- Consumes: `DanceVideo[]`.
- Produces: `DanceGallery({ items }: { items: DanceVideo[] })` — a `<section id="dance-zone">` (~320vh) with a `position: sticky; top:0; height:100vh` inner.

- [ ] **Step 1: Build the section**

Create `components/sections/DanceGallery.tsx` ('use client'):
- Outer `<section id="dance-zone" style={{ position:'relative', height:'320vh', backgroundColor:'transparent', borderTop:'2px solid var(--color-ink)' }}>`.
- Inner sticky wrapper `<div style={{ position:'sticky', top:0, height:'100vh', display:'flex', flexDirection:'column', justifyContent:'space-between', padding:'clamp(32px,5vw,64px) 24px', pointerEvents:'none' }}>`:
  - Top: a `mono-label` eyebrow `{'// '}DANCE` + an uppercase Syne heading (`t('danceTeaser.heading')` or a literal) — `pointerEvents:auto` on text.
  - The centre is left empty (the 3D ball + cylinder render there from the fixed canvas behind).
- **Static fallback grid** (rendered but hidden unless reduced-motion/no-WebGL): a `.hard-block` grid of the `items` (thumbnail or `<video>` + title/year), shown when a `fallback` flag is true. Compute `fallback` from `useEffect`: `window.matchMedia('(prefers-reduced-motion: reduce)').matches` OR no WebGL (same check as `JourneyBallMount`). When `fallback`, render the grid in normal flow (section height auto, not 320vh) and skip the tall pin.

- [ ] **Step 2: Swap into the home page**

In `app/(frontend)/[locale]/page.tsx`, replace `<DanceTeaser />` with `<DanceGallery items={dance} />` (keep it between `<Marquee/>` and `<Footer/>` inside the `zIndex:1` content wrapper).

- [ ] **Step 3: Typecheck, lint & visual verification**

Run: `npx tsc --noEmit ; npm run lint`. Reload; the dance area is now a tall scroll region with a bauhaus title; scrolling through it keeps the particle ball centred (from 2a). No cylinder yet (Task 4). With OS reduced-motion on, a static hard-block video grid shows instead.

- [ ] **Step 4: Commit**

```bash
git add components/sections/DanceGallery.tsx "app/(frontend)/[locale]/page.tsx"
git commit -m "Add DanceGallery pinned section (replaces DanceTeaser)"
```

---

### Task 4: `DanceCylinder` R3F + wire into JourneyBall (the orbit)

The 3D cylinder of video planes around the particle ball, rotated by the dance-pin progress, with front-plane enlarge + video play and real depth occlusion.

**Files:**
- Create: `components/three/DanceCylinder.tsx`
- Modify: `components/three/JourneyBall.tsx` (render cylinder + extend controller for the tall pinned section)

**Interfaces:**
- Consumes: `DanceVideo[]`, `three`, R3F.
- Produces: `DanceCylinder({ items, groupRef, lowPower }: { items: DanceVideo[]; groupRef: React.RefObject<THREE.Group|null>; lowPower: boolean })` — planes on a cylinder inside a group the controller positions/rotates; manages textures + front-plane video.

- [ ] **Step 1: Rework the dance anchor for the tall pinned section**

The 2a controller centred the ball at the DanceTeaser *section centre*. `DanceGallery` is 320vh, so use the sticky-pin model instead. In `JourneyBall`'s `Controller`, replace the dance block with:
```ts
const dance = document.getElementById('dance-zone')?.getBoundingClientRect()
// enter progress: 0 when top ≥ 0.6vh, 1 when top ≤ 0 (fully pinned)
const toDance = dance ? smoothstep(vh * 0.6, 0, dance.top) : 0
const danceCenter: Vec2 = { x: vp.width / 2, y: vh * 0.5 } // sticky viewport centre
target = mix2(target, danceCenter, toDance)
// pin progress through the tall section (0..1) drives the cylinder rotation
const dancePin = dance ? clamp01(-dance.top / Math.max(1, dance.height - vh)) : 0
```
Keep the morph = `toDance` cross-fade and the `lerp(ballScale(progress), 0.85, toDance)` scale.

- [ ] **Step 2: Rotate + show the cylinder**

Add a `cylinderRef = useRef<THREE.Group>(null)` in `JourneyBall`, render `<group ref={cylinderRef}><DanceCylinder items={danceItems} groupRef={cylinderRef} lowPower={lowPower} /></group>` in the canvas (sibling of the ball group). In the controller each frame:
```ts
const cyl = cylinderRef.current
if (cyl) {
  cyl.position.copy(g.position)              // centre on the ball
  cyl.rotation.y = dancePin * Math.PI * 2 * 1.0  // 1 full turn over the pin (tunable)
  cyl.visible = toDance > 0.01
  cyl.scale.setScalar(1)                     // cylinder radius set in DanceCylinder, not group scale
}
```
(Pass `dancePin` and the front-index responsibility into `DanceCylinder` via reading `cylinderRef.rotation.y` inside its own `useFrame`.)

- [ ] **Step 3: Implement `DanceCylinder`**

```tsx
'use client'
import { useMemo, useRef, useState } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import * as THREE from 'three'
import type { DanceVideo } from '@/lib/payload'

const R = 3.0          // cylinder radius (world units) — larger than the ~0.85 ball
const PLANE_W = 1.4
const PLANE_H = 2.4    // portrait (9:16-ish) dance clips

export function DanceCylinder({ items, groupRef, lowPower }: {
  items: DanceVideo[]; groupRef: React.RefObject<THREE.Group | null>; lowPower: boolean
}) {
  const n = Math.max(items.length, 1)
  const [front, setFront] = useState(0)

  // thumbnail textures (front plane swaps to a VideoTexture)
  const thumbUrls = items.map(it => it.thumbnailSrc || '')
  const textures = useLoader(THREE.TextureLoader, thumbUrls.map(u => u || '/logo-light.svg'))

  // front video texture (one <video>), created lazily
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const videoTex = useMemo(() => {
    if (typeof document === 'undefined') return null
    const v = document.createElement('video')
    v.muted = true; v.loop = true; v.playsInline = true; v.crossOrigin = 'anonymous'
    videoRef.current = v
    return new THREE.VideoTexture(v)
  }, [])

  // Determine front index from the parent group's rotation; only setState on change.
  useFrame(() => {
    const g = groupRef.current
    if (!g) return
    const idx = ((Math.round(-g.rotation.y / (Math.PI * 2 / n)) % n) + n) % n
    if (idx !== front) setFront(idx)
  })

  // Play the front video when it changes.
  useMemo(() => {
    const v = videoRef.current
    const src = items[front]?.videoSrc
    if (v && src && !lowPower) { v.src = src; v.play().catch(() => {}) }
  }, [front, items, lowPower])

  return (
    <>
      {items.map((it, i) => {
        const a = (i / n) * Math.PI * 2
        const x = Math.sin(a) * R, z = Math.cos(a) * R
        const isFront = i === front
        const tex = isFront && videoTex && !lowPower ? videoTex : textures[i]
        return (
          <mesh
            key={it.id}
            position={[x, 0, z]}
            rotation={[0, a, 0]}                 // face outward
            scale={isFront ? 1.25 : 1}
          >
            <planeGeometry args={[PLANE_W, PLANE_H]} />
            <meshBasicMaterial map={tex} toneMapped={false} side={THREE.DoubleSide} />
          </mesh>
        )
      })}
    </>
  )
}
```
Notes: planes face outward (rotation `a`) so their fronts point away from centre — the one nearest the camera (front index) reads to the viewer; adjust the `-g.rotation.y` sign / offset so the camera-facing plane is the one that enlarges/plays. `depthTest` default true → planes behind the ball are occluded. Frame/border look: optionally add a thin ink-coloured border plane behind each (Bauhaus) — tunable.

- [ ] **Step 4: Typecheck, lint & visual verification (manual)**

Run: `npx tsc --noEmit ; npm run lint ; npm test` (expect clean). `npm run dev`, home page, scroll into the Dance region and confirm:
1. Dance-video planes orbit on a cylinder around the particle ball; scrolling rotates them.
2. Planes rotating behind the ball are occluded by the particles/ball (real depth).
3. The camera-facing plane is larger and plays its video; others show thumbnails.
4. Ball stays centred during the pin; leaving the region ends cleanly.
5. Mobile / reduced-motion: falls back to the static grid (Task 3); no video autoplay storms.

Expect to tune: `R`, `PLANE_W/H`, turns, front-index offset/sign, enlarge scale. Commit once it reads right.

- [ ] **Step 5: Commit**

```bash
git add components/three/DanceCylinder.tsx components/three/JourneyBall.tsx
git commit -m "Add 3D dance cylinder orbiting the particle ball"
```

---

### Task 5: Remove the `/dance` sub-page + dead components

**Files:**
- Delete: `app/(frontend)/[locale]/dance/` (route), `components/sections/DancePage.tsx`, `components/ui/DanceVideoCard.tsx`, `components/sections/DanceTeaser.tsx`
- Verify: no imports/links to any of them or to `/dance` remain.

- [ ] **Step 1: Delete the files**

```bash
git rm -r "app/(frontend)/[locale]/dance"
git rm components/sections/DancePage.tsx components/ui/DanceVideoCard.tsx components/sections/DanceTeaser.tsx
```

- [ ] **Step 2: Purge references**

Run: `git grep -n "DancePage\|DanceVideoCard\|DanceTeaser\|/dance" -- app components` → fix any remaining import or link (e.g., a nav/teaser link to `/dance`). The DanceTeaser import in `page.tsx` should already be gone (Task 3 swapped it).

- [ ] **Step 3: Typecheck, lint, test & build-ish check**

Run: `npx tsc --noEmit ; npm run lint ; npm test` (expect clean). Reload the site; no 404s from removed routes; home dance gallery works.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Remove /dance sub-page and dead dance components"
```

---

## Notes

- Highest-risk feature in the project (R3F video textures + orbiting planes + pin coordination + depth). Expect real visual tuning in Task 4; the constants (`R`, plane size, turns, front sign/offset) are meant to be adjusted live.
- Video autoplay: only the front plane's `<video>` plays (muted, loop); others are static thumbnails. If a project has no `thumbnailSrc`, the loader falls back to a placeholder; a project with no `videoSrc` just stays a thumbnail when front.
- If `useLoader(TextureLoader)` on empty/placeholder URLs is flaky, switch to loading textures imperatively in a `useEffect` with per-item state — keep the plane visible with a solid blue material until its texture resolves.
- Phase C (about / project-detail pages restyle) remains a separate later plan.
