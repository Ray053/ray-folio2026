# Particle Ball — Phase 2a Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the scroll journey — the travelling noise ball continues past the projects/marquee and, as it enters the Dance zone near the footer, **dissolves into a glowing particle ball** (blue→lime points) that settles at the Dance-zone centre with a gentle spin. (The 3D dance carousel around it is Phase 2b.)

**Architecture:** Extend the existing fixed-canvas `JourneyBall`. A new `ParticleBall` (`THREE.Points` sphere, additive blue→lime shader) is rendered alongside the `NoiseBlob` mesh in the same group. The scroll controller gains a Dance-zone anchor (`#dance-zone`) and a `morph` value (0=mesh, 1=particles) that cross-fades the mesh out / particles in and drives a slight particle expansion + spin. Point positions come from a pure `fibonacciSphere` helper (unit-tested).

**Tech Stack:** React Three Fiber / Three.js / GLSL, GSAP (existing), Vitest (existing on this branch). No new deps.

## Global Constraints

- Design source of truth: `docs/superpowers/specs/2026-08-06-particle-ball-dance-gallery-design.md`. Phase 2a = particle morph only; NO carousel, NO `/dance` removal (Phase 2b).
- Builds on Phase 1 `JourneyBall` (fixed canvas, perspective camera, `lib/scrollJourney.ts`, `NoiseBlob` with `uOpacity`). Do not regress the Hero→About→Projects journey.
- **One continuous ball:** the SAME element cross-fades mesh→particles — never fade-out-and-respawn.
- Palette: particles electric blue `#0033FF` → acid lime `#CCFF00`; additive glow. No other accent.
- **Perf:** particle `count` reduced under `lowPower`; particles only render/spin while the journey/Dance zone is in view (existing `frameloop`/`inRange`).
- **a11y:** `prefers-reduced-motion` → particle ball is static (no spin/expansion churn); still morphs on scroll position (that's user-driven, not decorative auto-motion) but no idle spin.
- Motion: transform/opacity/shader-uniform only.

---

### Task 1: `fibonacciSphere` pure helper (`lib/particles.ts`)

A pure point-cloud generator (Fibonacci-sphere distribution) for the particle ball. Unit-tested.

**Files:**
- Create: `lib/particles.ts`
- Test: `lib/particles.test.ts`

**Interfaces:**
- Produces: `fibonacciSphere(count: number, radius: number): Float32Array` — `count*3` floats (x,y,z per point) evenly spread on a sphere of the given radius.

- [ ] **Step 1: Write the failing test**

Create `lib/particles.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { fibonacciSphere } from './particles'

describe('fibonacciSphere', () => {
  it('returns count*3 floats', () => {
    expect(fibonacciSphere(100, 1).length).toBe(300)
  })
  it('every point lies on the sphere of the given radius', () => {
    const r = 1.4
    const p = fibonacciSphere(200, r)
    for (let i = 0; i < p.length; i += 3) {
      const d = Math.hypot(p[i], p[i + 1], p[i + 2])
      expect(d).toBeCloseTo(r, 4)
    }
  })
  it('handles count 1 without NaN', () => {
    const p = fibonacciSphere(1, 2)
    expect(p.length).toBe(3)
    expect(Number.isNaN(p[0])).toBe(false)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test lib/particles.test.ts`
Expected: FAIL — `Cannot find module './particles'`.

- [ ] **Step 3: Implement `lib/particles.ts`**

```ts
/** Evenly distributed points on a sphere (Fibonacci spiral). Returns count*3 floats. */
export function fibonacciSphere(count: number, radius: number): Float32Array {
  const out = new Float32Array(count * 3)
  const golden = Math.PI * (3 - Math.sqrt(5)) // golden angle
  for (let i = 0; i < count; i++) {
    const y = count === 1 ? 0 : 1 - (i / (count - 1)) * 2 // 1 → -1
    const r = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = golden * i
    out[i * 3]     = Math.cos(theta) * r * radius
    out[i * 3 + 1] = y * radius
    out[i * 3 + 2] = Math.sin(theta) * r * radius
  }
  return out
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test lib/particles.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/particles.ts lib/particles.test.ts
git commit -m "Add fibonacciSphere point-cloud helper"
```

---

### Task 2: `ParticleBall` component (`components/three/ParticleBall.tsx`)

A `THREE.Points` sphere with an additive blue→lime shader, exposing `uOpacity` (fade-in) and `uExpand` (slight outward drift) via its material so the controller can drive the morph. Verified visually in Task 3.

**Files:**
- Create: `components/three/ParticleBall.tsx`

**Interfaces:**
- Consumes: `lib/particles` (`fibonacciSphere`), `three`, R3F.
- Produces: `ParticleBall({ count, radius, pointsRef }: { count?: number; radius?: number; pointsRef: React.RefObject<THREE.Points | null> })` — renders a `<points>`; its material uniforms `uOpacity` (0..1), `uExpand` (0..1), `uSize` are written by the controller. Default `count=1400`, `radius=1.4` (matches the NoiseBlob icosahedron radius).

- [ ] **Step 1: Implement the component**

```tsx
'use client'
import { useMemo } from 'react'
import * as THREE from 'three'
import { fibonacciSphere } from '@/lib/particles'

const vertexShader = /* glsl */`
  attribute float aRnd;
  uniform float uExpand;
  uniform float uSize;
  varying float vRnd;
  void main() {
    vRnd = aRnd;
    // drift outward a touch as the ball dissolves
    vec3 p = position * (1.0 + uExpand * (0.15 + aRnd * 0.5));
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = uSize * (300.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`

const fragmentShader = /* glsl */`
  precision mediump float;
  uniform float uOpacity;
  varying float vRnd;
  void main() {
    // round point
    vec2 c = gl_PointCoord - 0.5;
    float d = dot(c, c);
    if (d > 0.25) discard;
    float soft = smoothstep(0.25, 0.0, d);
    vec3 blue = vec3(0.000, 0.200, 1.000); // #0033FF
    vec3 lime = vec3(0.800, 1.000, 0.000); // #CCFF00
    vec3 col = mix(blue, lime, step(0.82, vRnd)); // ~18% lime specks
    gl_FragColor = vec4(col, uOpacity * soft);
  }
`

export function ParticleBall({
  count = 1400, radius = 1.4, pointsRef,
}: { count?: number; radius?: number; pointsRef: React.RefObject<THREE.Points | null> }) {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(fibonacciSphere(count, radius), 3))
    const rnd = new Float32Array(count)
    for (let i = 0; i < count; i++) rnd[i] = Math.random()
    geo.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 1))
    return geo
  }, [count, radius])

  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader, fragmentShader,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uOpacity: { value: 0 }, uExpand: { value: 0 }, uSize: { value: 3.2 } },
  }), [])

  return <points ref={pointsRef} geometry={geometry} material={material} />
}
```

- [ ] **Step 2: Typecheck & lint**

Run: `npx tsc --noEmit ; npm run lint`
Expected: clean (no new errors in `ParticleBall.tsx`).

- [ ] **Step 3: Commit**

```bash
git add components/three/ParticleBall.tsx
git commit -m "Add particle ball (points sphere, blue->lime additive)"
```

---

### Task 3: Wire the morph into `JourneyBall` + Dance anchor (`JourneyBall.tsx`, `DanceTeaser.tsx`)

Render `ParticleBall` alongside `NoiseBlob` in the journey group, add a Dance-zone anchor, extend the controller to continue the journey into the Dance zone and cross-fade mesh→particles there, with a gentle particle spin.

**Files:**
- Modify: `components/three/JourneyBall.tsx`
- Modify: `components/sections/DanceTeaser.tsx` (add `id="dance-zone"`)

**Interfaces:**
- Consumes: `components/three/ParticleBall` (`ParticleBall`).

- [ ] **Step 1: Add the Dance-zone anchor**

In `components/sections/DanceTeaser.tsx`, add `id="dance-zone"` to the top-level `<section>` so the controller can find the settle/morph target. (Phase 2b will move this id to the gallery section.)

- [ ] **Step 2: Render the ParticleBall + refs**

In `JourneyBall.tsx`:
1. Import `ParticleBall` and add a `pointsRef = useRef<THREE.Points>(null)` in the `JourneyBall` component; pass it down to the `Controller` (new prop) and render `<ParticleBall pointsRef={pointsRef} count={lowPower ? 600 : 1400} />` inside the same `<group ref={groupRef}>` as `<NoiseBlob>`. Keep `NoiseBlob` as `children[0]`; `ParticleBall` becomes `children[1]`.
2. `Controller` signature gains `pointsRef` and `reducedMotion` (already has reducedMotion).

- [ ] **Step 3: Extend the controller — dance anchor, morph, spin**

In the `Controller`'s `useFrame`, after the existing anchor/scale logic:
1. Read the Dance anchor: `const dance = document.getElementById('dance-zone')?.getBoundingClientRect()`.
2. Extend the settle target: after the trajectory blend, blend toward the Dance-zone centre as it scrolls in:
   ```ts
   const danceCenter: Vec2 = dance
     ? { x: vp.width / 2, y: dance.top + dance.height / 2 }
     : target
   const toDance = dance ? smoothstep(vh * 0.85, vh * 0.5, dance.top + dance.height / 2) : 0
   target = mix2(target, danceCenter, toDance)
   ```
   (Apply this before the `screenToWorld` conversion; keeps the ball travelling into the Dance zone and centring there.)
3. Compute morph and cross-fade:
   ```ts
   const morph = toDance // 0 until dance enters, 1 when centred
   // mesh fades out, particles fade in
   const mesh = g.children[0] as THREE.Mesh | undefined
   const meshMat = mesh?.material as THREE.ShaderMaterial | undefined
   if (meshMat?.uniforms?.uOpacity) meshMat.uniforms.uOpacity.value = ballOpacity(progress) * (1 - morph)
   const pts = pointsRef.current
   const pMat = pts?.material as THREE.ShaderMaterial | undefined
   if (pMat?.uniforms) {
     pMat.uniforms.uOpacity.value = morph
     pMat.uniforms.uExpand.value = morph
   }
   ```
   (Remove/replace the old `setOpacity(g, ballOpacity(progress))` call so the mesh opacity now includes the `(1-morph)` factor.)
4. Gentle particle spin (skip when reduced-motion):
   ```ts
   if (pts && !reducedMotion) pts.rotation.y += 0.0016
   ```
5. Keep `g.scale.setScalar(ballScale(progress))` and the position lerp as-is (particles share the group scale/position, so they sit exactly where the mesh was).

- [ ] **Step 4: Typecheck, lint & visual verification (manual)**

Run: `npx tsc --noEmit ; npm run lint ; npm test` (expect clean; particles + scrollJourney suites pass). Then `npm run dev`, open the home page and confirm:
1. Hero→About→Projects journey unchanged (still the electric-blue mesh ball).
2. Scrolling toward the bottom, the SAME ball reaches the Dance area centre and **dissolves into a blue/lime particle ball** (no fade-out/respawn); it spins gently.
3. Scroll back up: it re-forms into the mesh ball (morph is scroll-linked, reversible).
4. `prefers-reduced-motion`: particle ball does not idle-spin.
5. Mobile width: fewer particles, no jank.

Tune constants (particle `count`, `uSize`, morph `smoothstep` edges, spin speed) to taste, then commit.

- [ ] **Step 5: Commit**

```bash
git add components/three/JourneyBall.tsx components/sections/DanceTeaser.tsx
git commit -m "Journey ball morphs to particle ball in the Dance zone"
```

---

## Notes

- `#dance-zone` currently lives on `DanceTeaser`; Phase 2b removes `DanceTeaser` and puts `#dance-zone` on the pinned gallery section. The controller only depends on the id, so the hand-off is clean.
- Footer settle/fade of the particle ball is minimal in 2a (it just stays centred in the Dance zone and scrolls out with the page as the journey ends). A dedicated footer treatment can come with 2b.
- Phase 2b (3D dance carousel around the particle ball + `/dance` removal) is a separate plan.
