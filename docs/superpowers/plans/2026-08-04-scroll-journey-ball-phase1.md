# Scroll Journey Ball — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the Hero noise ball into ONE persistent, semi-transparent 3D ball that travels the home page by scroll — big in the Hero, drifting to the middle of the About (ProfileSection), then shrinking to a small ball riding the existing blue trajectory curve through the Projects section. (Phase 2 — the Marquee→Dance→Footer particle dissolve — is a separate later plan.)

**Architecture:** A single `position: fixed` full-viewport R3F `<Canvas>` mounted once on the home page, behind all content. A **perspective camera** (kept, so the ball looks like it does today) plus a pure `screenToWorld` mapping converts DOM anchor pixel positions (viewport center, ProfileSection middle, sampled trajectory-path point) into the ball's world position each frame. Scale and opacity are pure keyframed functions of overall scroll progress. The ball reuses the existing `NoiseBlob` shader, extended with a `uOpacity` uniform.

**Tech Stack:** Next.js 15, React Three Fiber / Three.js / GLSL, GSAP ScrollTrigger (existing), Vitest (re-added — this branch has no test runner yet).

## Global Constraints

- Design/behavior source of truth: `docs/superpowers/specs/2026-08-04-scroll-journey-ball-design.md`. Phase 1 = zones 1–3 only (Hero → About → Projects). Do NOT build the particle system or footer dissolve.
- **One ball, continuous:** the same mesh scales/moves/fades across zones — never fade-out-and-respawn.
- **Pure blue, semi-transparent:** ball uses the existing pure-blue `NoiseBlob` shader (#001B3D→#0A84FF→#5AB0FF→#EAF4FF) at ~0.6 opacity. No other accent color.
- **Behind content:** the fixed canvas sits behind all content (content `z-index` above); text stays readable (existing text-shadows + scrim where needed).
- **Reuse, don't duplicate:** the small ball reuses the SAME ball; the existing `UnifiedTrajectory` blue SVG trail line STAYS; its own 20px DOM ball is REMOVED (the 3D ball takes over the path).
- **Perspective camera + `screenToWorld`** (this plan's refinement of the spec's "ortho pixel camera") so the shader keeps its current look; the ball is scaled by modest world factors (~1.0→0.3), never hundreds, so world-position-based shading stays valid.
- **Perf:** one mesh only; fixed canvas `frameloop='always'` only while the journey range is in view, else `'never'`. Animate via transform/opacity/uniforms only.
- **a11y:** `prefers-reduced-motion` → no scroll journey; ball parks statically in the Hero. WebGL unavailable → do not mount the canvas; page renders normally.
- **lowPower (mobile / coarse pointer):** reduced `dpr`, hand-tracking interaction disabled (Hero zone only anyway).
- Do NOT touch i18n, routing, Payload, or other routes. Home page only.

---

### Task 1: Pure scroll-journey math + Vitest (`lib/scrollJourney.ts`)

Re-establish Vitest (this branch has none) and implement the pure functions the controller needs: perspective screen→world mapping, small interpolation helpers, and the scroll-progress→scale / →opacity keyframes. This is the testable core; the R3F wiring in Task 3 stays thin.

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json` (add `test`/`test:watch` scripts + `vitest` devDependency)
- Create: `lib/scrollJourney.ts`
- Test: `lib/scrollJourney.test.ts`

**Interfaces:**
- Consumes: nothing (pure).
- Produces:
  - `type Vec2 = { x: number; y: number }`
  - `interface Viewport { width: number; height: number }`
  - `interface CameraParams { fov: number; distance: number }` — perspective vertical FOV in degrees, camera distance from the z=0 plane.
  - `clamp01(n): number`, `lerp(a, b, t): number`, `smoothstep(edge0, edge1, x): number`, `mix2(a: Vec2, b: Vec2, t): Vec2`
  - `screenToWorld(px: number, py: number, vp: Viewport, cam: CameraParams): Vec2` — screen pixels (top-left origin) → world x/y on the z=0 plane.
  - `ballScale(progress: number): number` — journey progress 0..1 → world scale factor.
  - `ballOpacity(progress: number): number` — journey progress 0..1 → opacity.
  - `JOURNEY = { camDistance: 6, camFov: 40, opacity: 0.62 }` — shared tunable constants.

- [ ] **Step 1: Install Vitest + scripts**

Run: `npm install -D vitest`
Then add to `package.json` `scripts`:
```json
    "test": "vitest run",
    "test:watch": "vitest"
```

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts', 'components/**/*.test.ts'],
  },
})
```

- [ ] **Step 3: Write the failing tests**

Create `lib/scrollJourney.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import {
  clamp01, lerp, smoothstep, mix2, screenToWorld, ballScale, ballOpacity, JOURNEY,
} from './scrollJourney'

describe('helpers', () => {
  it('clamp01 bounds to [0,1]', () => {
    expect(clamp01(-1)).toBe(0); expect(clamp01(2)).toBe(1); expect(clamp01(0.5)).toBe(0.5)
  })
  it('lerp interpolates', () => {
    expect(lerp(0, 10, 0.5)).toBe(5); expect(lerp(4, 8, 0)).toBe(4)
  })
  it('smoothstep is 0 below, 1 above, 0.5 at midpoint', () => {
    expect(smoothstep(0, 1, -1)).toBe(0)
    expect(smoothstep(0, 1, 2)).toBe(1)
    expect(smoothstep(0, 1, 0.5)).toBeCloseTo(0.5)
  })
  it('mix2 interpolates both axes', () => {
    expect(mix2({ x: 0, y: 0 }, { x: 10, y: 20 }, 0.5)).toEqual({ x: 5, y: 10 })
  })
})

describe('screenToWorld', () => {
  const vp = { width: 1000, height: 800 }
  const cam = { fov: 40, distance: 6 }
  it('maps screen centre to world origin', () => {
    const w = screenToWorld(500, 400, vp, cam)
    expect(w.x).toBeCloseTo(0); expect(w.y).toBeCloseTo(0)
  })
  it('screen down/right maps to world -y/+x', () => {
    const w = screenToWorld(750, 600, vp, cam)
    expect(w.x).toBeGreaterThan(0)  // right of centre
    expect(w.y).toBeLessThan(0)     // below centre → negative world y
  })
  it('world height at z=0 equals 2*d*tan(fov/2)', () => {
    // point at top edge (py=0) should have worldY = +visibleHeight/2
    const w = screenToWorld(500, 0, vp, cam)
    const vh = 2 * cam.distance * Math.tan((cam.fov / 2) * Math.PI / 180)
    expect(w.y).toBeCloseTo(vh / 2)
  })
})

describe('ballScale', () => {
  it('is large at journey start and small at end', () => {
    expect(ballScale(0)).toBeGreaterThan(ballScale(1))
  })
  it('decreases monotonically (sampled)', () => {
    let prev = ballScale(0)
    for (let p = 0.1; p <= 1; p += 0.1) {
      const cur = ballScale(p)
      expect(cur).toBeLessThanOrEqual(prev + 1e-6)
      prev = cur
    }
  })
  it('stays positive', () => {
    for (let p = 0; p <= 1; p += 0.25) expect(ballScale(p)).toBeGreaterThan(0)
  })
})

describe('ballOpacity', () => {
  it('stays within a sane translucent range', () => {
    for (let p = 0; p <= 1; p += 0.25) {
      const o = ballOpacity(p)
      expect(o).toBeGreaterThan(0.3); expect(o).toBeLessThanOrEqual(1)
    }
  })
})

describe('JOURNEY constants', () => {
  it('exposes camera + opacity tunables', () => {
    expect(JOURNEY.camDistance).toBeGreaterThan(0)
    expect(JOURNEY.camFov).toBeGreaterThan(0)
    expect(JOURNEY.opacity).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module './scrollJourney'`.

- [ ] **Step 5: Implement `lib/scrollJourney.ts`**

```ts
export type Vec2 = { x: number; y: number }
export interface Viewport { width: number; height: number }
export interface CameraParams { fov: number; distance: number }

// ── Tunable constants (safe to tweak while tuning the look) ──────────
export const JOURNEY = {
  camDistance: 6,   // camera z distance from the ball plane
  camFov: 40,       // perspective vertical FOV (deg)
  opacity: 0.62,    // ball translucency
} as const

export const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n)

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0))
  return t * t * (3 - 2 * t)
}

export const mix2 = (a: Vec2, b: Vec2, t: number): Vec2 => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
})

/** Screen pixel (top-left origin) → world x/y on the z=0 plane, perspective camera looking down -z from +z. */
export function screenToWorld(px: number, py: number, vp: Viewport, cam: CameraParams): Vec2 {
  const visibleHeight = 2 * cam.distance * Math.tan((cam.fov / 2) * Math.PI / 180)
  const visibleWidth = visibleHeight * (vp.width / vp.height)
  return {
    x: (px / vp.width - 0.5) * visibleWidth,
    y: (0.5 - py / vp.height) * visibleHeight,
  }
}

// ── Scale keyframes across journey progress 0..1 ─────────────────────
// 0.00–0.35 hero (big) → 0.35–0.62 about (shrink) → 0.62–1.0 projects (small)
export function ballScale(progress: number): number {
  const p = clamp01(progress)
  const big = 1.0, mid = 0.5, small = 0.3
  if (p < 0.35) return big
  if (p < 0.62) return lerp(big, mid, smoothstep(0.35, 0.62, p))
  return lerp(mid, small, smoothstep(0.62, 1.0, p))
}

// Slightly more opaque as it shrinks so the small ball still reads.
export function ballOpacity(progress: number): number {
  const p = clamp01(progress)
  return lerp(JOURNEY.opacity, Math.min(JOURNEY.opacity + 0.15, 0.85), smoothstep(0.6, 1.0, p))
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — all `scrollJourney` tests green.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vitest.config.ts lib/scrollJourney.ts lib/scrollJourney.test.ts
git commit -m "Add scroll-journey pure math + Vitest"
```

---

### Task 2: Add `uOpacity` + scale-invariant color to `NoiseBlob` (`components/three/NoiseBlob.tsx`)

The journey ball reuses `NoiseBlob` but scales it (~1.0→0.3) and renders it semi-transparent. Two shader changes: (1) a `uOpacity` uniform on the fragment alpha; (2) make the blue-ramp coordinate use the *local* vertex Y (bounded, scale-invariant) instead of `vWorldPos.y`, so scaling the mesh doesn't wash out the color. Default `uOpacity = 1.0` keeps existing callers visually unchanged.

**Files:**
- Modify: `components/three/NoiseBlob.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: `NoiseBlob` now accepts an optional `opacity?: number` prop (default 1) wired to a `uOpacity` uniform; the material is `transparent`.

- [ ] **Step 1: Add the `uOpacity` uniform + transparency + scale-invariant color**

Context: `NoiseBlob` uses a `<shaderMaterial ref={materialRef} uniforms={uniforms} …>` (uniforms built by a `useMemo` with `uTime`/`uStrength`/`uMouse`); the fragment's pure-blue ramp currently reads `vWorldPos.y`; the ball is scaled by the parent (Task 3), which would wash out world-position-based color. Make these edits in `components/three/NoiseBlob.tsx`:

1. **Props:** add `opacity?: number` to the props type, and default it in the destructure (e.g. `opacity = 1`).
2. **Vertex shader:** add `varying float vLocalY;` and set `vLocalY = position.y;` (the raw, undisplaced icosahedron vertex Y — bounded regardless of mesh scale).
3. **Fragment shader:** declare `varying float vLocalY;` and `uniform float uOpacity;`. In the blue-ramp `b`, replace the `vWorldPos.y * 0.15` term with `vLocalY * 0.15` (identical value at scale 1 since local≈world Y there, but scale-invariant). Change the final line `gl_FragColor = vec4(color, 1.0);` → `gl_FragColor = vec4(color, uOpacity);`.
4. **Uniforms:** add `uOpacity: { value: 1 }` to the `useMemo` uniforms object.
5. **Set from prop on change only (NOT every frame):** add `useEffect(() => { if (materialRef.current) materialRef.current.uniforms.uOpacity.value = opacity }, [opacity])`. (Setting it once per prop-change — rather than every frame — lets the journey Controller in Task 3 write `uOpacity` per-frame without a fight. `useEffect` is already imported in this file; if not, add it.)
6. **Material flags:** on the `<shaderMaterial>` element add `transparent` and `depthWrite={false}`.

Keep everything else (geometry radius 1.4, lights, Fresnel, specular, mouse deform, offset/scaleFactor/scroll-driven uStrength) unchanged. At `opacity=1` the Hero ball (still rendered via `NoiseBlobScene` until Task 4) must look identical.

- [ ] **Step 2: Typecheck & lint**

Run: `npx tsc --noEmit ; npm run lint`
Expected: clean (no new errors in `NoiseBlob.tsx`).

- [ ] **Step 3: Visual verification (manual — controller/user)**

The Hero still renders this via `NoiseBlobScene` at this point, so confirm the Hero ball looks unchanged at `opacity=1` (default): still a solid pure-blue glowing orb, color not washed out. (The journey wiring comes in Task 4.)

- [ ] **Step 4: Commit**

```bash
git add components/three/NoiseBlob.tsx
git commit -m "NoiseBlob: add uOpacity + scale-invariant color for journey reuse"
```

---

### Task 3: Journey ball canvas + scroll controller (`components/three/JourneyBall.tsx`)

A fixed full-viewport `<Canvas>` (perspective camera) rendering one `NoiseBlob`, whose world position/scale/opacity are driven every frame from scroll + DOM anchors via `lib/scrollJourney`. Anchors: Hero → viewport centre; About → the `#profile` section's viewport-space middle; Projects → the sampled point on the existing trajectory path. Mounting into the page is Task 4; this task builds and self-contains the component (typecheck/lint only here).

**Files:**
- Create: `components/three/JourneyBall.tsx`

**Interfaces:**
- Consumes: `lib/scrollJourney` (`screenToWorld, mix2, smoothstep, clamp01, ballScale, ballOpacity, JOURNEY`); `components/three/NoiseBlob` (`NoiseBlob` with `opacity` prop); `@react-three/fiber`; `three`.
- Produces: `JourneyBall({ lowPower }: { lowPower: boolean })` — a fixed-position canvas element (returns the wrapper + `<Canvas>`); no imperative API.
- DOM contract it reads (Task 4 must provide these): element `#profile` (the About section), `#journey-layer` (the trajectory layer div), and `#journey-path` (the SVG `<path>`).

- [ ] **Step 1: Implement the component**

```tsx
'use client'
import { useRef, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { NoiseBlob } from './NoiseBlob'
import {
  screenToWorld, mix2, smoothstep, clamp01, ballScale, ballOpacity, JOURNEY, type Vec2,
} from '@/lib/scrollJourney'

// Reads scroll + DOM anchors each frame and drives the ball's position, scale, opacity.
function Controller({ groupRef, reducedMotion }: {
  groupRef: React.RefObject<THREE.Group | null>
  reducedMotion: boolean
}) {
  const { size } = useThree()
  const cam = { fov: JOURNEY.camFov, distance: JOURNEY.camDistance }
  const cur = useRef<Vec2>({ x: 0, y: 0 })

  // Reach the NoiseBlob mesh's ShaderMaterial to write uOpacity directly.
  const setOpacity = (g: THREE.Group, o: number) => {
    const mesh = g.children[0] as THREE.Mesh | undefined
    const mat = mesh?.material as THREE.ShaderMaterial | undefined
    if (mat?.uniforms?.uOpacity) mat.uniforms.uOpacity.value = o
  }

  useFrame(() => {
    const g = groupRef.current
    if (!g) return
    const vp = { width: size.width, height: size.height }

    if (reducedMotion) {
      // Park statically in the hero (viewport centre), big.
      const w = screenToWorld(vp.width / 2, vp.height * 0.5, vp, cam)
      g.position.set(w.x, w.y, 0)
      g.scale.setScalar(ballScale(0))
      setOpacity(g, ballOpacity(0))
      return
    }

    const scrollY = window.scrollY
    const vh = vp.height

    // Anchor DOM rects (viewport-space).
    const profile = document.getElementById('profile')?.getBoundingClientRect()
    const layerEl = document.getElementById('journey-layer')
    const pathEl = document.getElementById('journey-path') as unknown as SVGPathElement | null
    const layer = layerEl?.getBoundingClientRect()

    // Global progress: 0 at top of page → 1 near the bottom of the trajectory layer.
    const journeyEnd = layer ? scrollY + layer.bottom - vh * 0.5 : vh * 3
    const progress = clamp01(scrollY / Math.max(1, journeyEnd))

    // Candidate anchors in screen px.
    const heroPt: Vec2 = { x: vp.width / 2, y: vh * 0.46 }
    const aboutPt: Vec2 = profile
      ? { x: vp.width / 2, y: profile.top + profile.height / 2 }
      : heroPt

    let trajPt: Vec2 | null = null
    if (layer && pathEl) {
      // progress within the trajectory layer (0 at its top entering, 1 at bottom)
      const tp = clamp01((vh * 0.75 - layer.top) / Math.max(1, layer.height))
      const len = pathEl.getTotalLength()
      const pt = pathEl.getPointAtLength(len * tp) // normalized 0..1 in the layer's viewBox
      trajPt = { x: layer.left + pt.x * layer.width, y: layer.top + pt.y * layer.height }
    }

    // Blend anchors: hero → about (as #profile centre approaches viewport middle),
    // about → trajectory (as the trajectory layer scrolls in).
    const toAbout = profile ? smoothstep(vh * 0.9, vh * 0.5, profile.top + profile.height / 2) : 0
    const toTraj = layer ? smoothstep(vh * 0.6, vh * 0.1, layer.top) : 0
    let target = mix2(heroPt, aboutPt, toAbout)
    if (trajPt) target = mix2(target, trajPt, toTraj)

    // Screen → world, smoothed.
    const world = screenToWorld(target.x, target.y, vp, cam)
    cur.current.x += (world.x - cur.current.x) * 0.15
    cur.current.y += (world.y - cur.current.y) * 0.15
    g.position.set(cur.current.x, cur.current.y, 0)
    g.scale.setScalar(ballScale(progress))
    setOpacity(g, ballOpacity(progress))
  })

  return null
}

export function JourneyBall({ lowPower }: { lowPower: boolean }) {
  const groupRef = useRef<THREE.Group>(null)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [inRange, setInRange] = useState(true)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const u = () => setReducedMotion(mq.matches); u()
    mq.addEventListener('change', u)
    return () => mq.removeEventListener('change', u)
  }, [])

  // Pause rendering once fully scrolled past the trajectory layer.
  useEffect(() => {
    const onScroll = () => {
      const layer = document.getElementById('journey-layer')?.getBoundingClientRect()
      setInRange(!layer || layer.bottom > -200)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div aria-hidden style={{
      position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
    }}>
      <Canvas
        camera={{ position: [0, 0, JOURNEY.camDistance], fov: JOURNEY.camFov }}
        gl={{ antialias: !lowPower, alpha: true, premultipliedAlpha: false }}
        dpr={lowPower ? 1 : [1, 2]}
        frameloop={inRange ? 'always' : 'never'}
        style={{ background: 'transparent' }}
      >
        <group ref={groupRef}>
          <NoiseBlob active={false} scaleFactor={1} detail={lowPower ? 3 : 5} />
        </group>
        <Controller groupRef={groupRef} reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  )
}
```
> Note: `NoiseBlob` (verified) takes all-optional props `spawnRef/posRef/active/offset/scaleFactor/frozenRef/detail` plus the new `opacity` (Task 2). Passing `active={false} scaleFactor={1} detail={…} opacity={…}` keeps its internal mesh at group-local origin (offset defaults to `[0,0]`, handPos stays 0 when inactive) and at unit scale, so the parent `<group>`'s position/scale fully control the ball. `detail` MUST be passed (its geometry uses it directly). The scale keyframes / anchor thresholds (`vh * 0.46`, `0.15` smoothing, the `smoothstep` edges) are **tuning constants** — expect to adjust them during visual verification.

- [ ] **Step 2: Typecheck & lint**

Run: `npx tsc --noEmit ; npm run lint`
Expected: clean (no new errors in `JourneyBall.tsx`).

- [ ] **Step 3: Commit**

```bash
git add components/three/JourneyBall.tsx
git commit -m "Add fixed journey-ball canvas + scroll controller"
```

---

### Task 4: Integrate into the home page (mount, de-Hero, trajectory hand-off, layering)

Wire everything together: mount `JourneyBall` as a fixed layer on the home page, stop the Hero from rendering its own ball, remove `UnifiedTrajectory`'s DOM ball while keeping the trail line and exposing the path/layer ids, and make the layering let the fixed ball show behind content. This is the visual payoff — verified in the browser.

**Files:**
- Modify: `app/(frontend)/[locale]/page.tsx` (mount JourneyBall; needs a client boundary for `lowPower`)
- Create: `components/three/JourneyBallMount.tsx` (small `'use client'` wrapper computing `lowPower` + dynamic import, `ssr:false`)
- Modify: `components/sections/HeroSection.tsx` (remove `NoiseBlobScene`)
- Modify: `components/ui/UnifiedTrajectory.tsx` (add `id`s, remove DOM ball, transparent wrapper)

**Interfaces:**
- Consumes: `components/three/JourneyBall` (`JourneyBall`).
- Produces: none (integration).

- [ ] **Step 1: Client mount wrapper for the fixed ball**

Create `components/three/JourneyBallMount.tsx`:
```tsx
'use client'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const JourneyBall = dynamic(
  () => import('./JourneyBall').then(m => m.JourneyBall),
  { ssr: false }
)

export function JourneyBallMount() {
  const [lowPower, setLowPower] = useState(false)
  const [webgl, setWebgl] = useState(true)
  useEffect(() => {
    setLowPower(window.matchMedia('(max-width: 768px), (pointer: coarse)').matches)
    try {
      const c = document.createElement('canvas')
      setWebgl(!!(c.getContext('webgl2') || c.getContext('webgl')))
    } catch { setWebgl(false) }
  }, [])
  if (!webgl) return null
  return <JourneyBall lowPower={lowPower} />
}
```

- [ ] **Step 2: Mount it on the home page + layer content above it**

In `app/(frontend)/[locale]/page.tsx`, import and render `JourneyBallMount` once, before the content, and wrap the page content so it sits above the fixed canvas (`z-index: 1`). Keep the existing sections/order:
```tsx
import { JourneyBallMount } from '@/components/three/JourneyBallMount'
// ...
  return (
    <>
      <JourneyBallMount />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <HeroSection />
        <UnifiedTrajectory>
          <ProfileSection photoSrc={site?.photoSrc} />
          <ProjectsSection projects={projects} />
        </UnifiedTrajectory>
        <Marquee items={['UX DESIGN', 'CREATIVE', 'INTERACTION', 'DANCE', 'MOTION']} />
        <DanceTeaser />
      </div>
    </>
  )
```

- [ ] **Step 3: Remove the ball from the Hero + make its background transparent**

In `components/sections/HeroSection.tsx`:
1. Remove the `NoiseBlobScene` dynamic import and its usage (the `<div ref={blobRef}>…<NoiseBlobScene/></div>` block). Keep the `hero-stage`, the blue halo, gradients, `ParticleCursor`, hero text, `WebcamToggle`, and the text scroll parallax. If `blobRef` becomes unused, remove it and its GSAP tween; leave the text parallax intact.
2. Change the hero `<section>`'s `backgroundColor: 'var(--color-background)'` to `'transparent'` so the fixed journey ball behind it shows through (the `<body>` already paints `var(--color-background)`, so the base color is unchanged — only the opaque occluder is removed; the `hero-stage` glow and halo still render above the ball).

(The journey ball now provides the Hero orb from the fixed layer behind.)

- [ ] **Step 4: UnifiedTrajectory — keep the line, remove the DOM ball, expose ids, transparent wrapper**

In `components/ui/UnifiedTrajectory.tsx`:
1. Add `id="journey-layer"` to the trajectory layer `<div ref={layerRef}>` and `id="journey-path"` to the `<path ref={pathRef}>`.
2. Delete the `<div ref={ballRef}>` DOM ball element and the `ball` references in the effect (keep the path stroke-dashoffset draw-on animation driven by the ScrollTrigger `onUpdate`; just remove the two lines that read/transform `ball`).
3. Change the wrapper's `backgroundColor: 'var(--color-background)'` to `backgroundColor: 'transparent'` so the fixed ball behind shows through.

- [ ] **Step 5: Typecheck, lint & full test**

Run: `npx tsc --noEmit ; npm run lint ; npm test`
Expected: clean; scrollJourney tests pass.

- [ ] **Step 6: Visual verification (manual — controller/user, both themes)**

Run `npm run dev` (server may be on :3100). On the home page confirm:
1. Hero shows ONE semi-transparent pure-blue ball (content/text readable over it); mouse still interacts in the hero area.
2. Scrolling down: the SAME ball drifts smoothly to the middle of the About section and starts shrinking (no fade-out/respawn).
3. In Projects: the ball is small and rides the existing blue curve; the old 20px DOM ball is gone; the trail line remains.
4. The ball sits behind text/cards throughout; text stays legible (add a scrim to a section only if a specific block becomes unreadable).
5. `prefers-reduced-motion`: the ball parks in the hero, no journey.
6. Mobile width / reload: still renders, no jank; scrolling past Projects pauses the canvas (no errors in console).

Tuning constants live in `lib/scrollJourney.ts` (`ballScale` keyframes, `JOURNEY.opacity`) and `JourneyBall.tsx` (anchor thresholds, `0.15` smoothing). Adjust to taste, re-verify, then commit.

- [ ] **Step 7: Commit**

```bash
git add "app/(frontend)/[locale]/page.tsx" components/three/JourneyBallMount.tsx components/sections/HeroSection.tsx components/ui/UnifiedTrajectory.tsx
git commit -m "Mount journey ball; hand off Hero + trajectory to the persistent ball"
```

---

## Notes

- `components/three/NoiseBlobScene.tsx` becomes unused after Task 4 (Hero no longer imports it). Leave it in the tree for now; a later cleanup can remove it once confirmed unused.
- Opacity is written per-frame by the Controller directly onto the ball's `ShaderMaterial` uniform (via `groupRef.current.children[0]`), so `NoiseBlob`'s own `uOpacity`-from-prop only fires on prop change (Task 2 `useEffect`) and the two never fight. If `NoiseBlob`'s render root ever stops being the mesh as `children[0]`, update the `setOpacity` accessor accordingly.
- Phase 2 (Marquee→Dance→Footer particle dissolve) is a separate plan; do not build it here.
