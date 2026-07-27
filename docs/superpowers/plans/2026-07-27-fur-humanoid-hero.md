# Fur Humanoid Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Hero's metallic noise blob with a shaggy fur humanoid that idles on load and mirrors the user's body in real time via MediaPipe PoseLandmarker.

**Architecture:** Pure math (`lib/poseRig.ts`) turns MediaPipe world landmarks into per-segment transforms; a body-tracking singleton (`lib/bodyTracking.ts`) wraps PoseLandmarker; a shell-fur `ShaderMaterial` (`components/three/FurMaterial.ts`) renders fur as N normal-offset instanced shells; `FurHumanoid` places fur-covered cylinders (limbs/torso) + spheres (joints/head) each frame; `FurHumanoidScene` hosts the Canvas; `HeroSection` swaps to it. No skeleton/IK — capsule segments are placed directly and fur hides the joint seams.

**Tech Stack:** Next.js 15, React Three Fiber, Three.js, @mediapipe/tasks-vision (PoseLandmarker), GSAP (existing), Vitest (new, for pure-logic tests).

## Global Constraints

- Fur color uses the design system's metallic cool blue-gray: root `#122333` → tip `#8AAABF`, highlight `#A0C4D8`. Light/Dark each get a root/tip pair.
- Single signature fur look — NO multi-preset fur, NO pre-recorded pose animations (YAGNI).
- No skeleton/rig/IK — segments placed directly from landmarks; joint spheres + fur cover seams.
- Do NOT rewrite `lib/poseTracking.ts` (hand tracking) — it still feeds dormant NoiseBlob code. Add `lib/bodyTracking.ts` instead.
- Do NOT delete `NoiseBlob*.tsx`, `SplinterSystem.tsx`, `BlobTrail.tsx`, `lib/handGestures.ts` — leave dormant; Hero simply stops importing them.
- Two device tiers via existing `lowPower`: shells 16 (desktop) / 6 (mobile); dpr [1,2] / 1; antialias on / off.
- Camera is opt-in (`WebcamToggle`); frames run MediaPipe locally, never uploaded, no visible `<video>`.
- `prefers-reduced-motion`: no idle sway, no fur sway; static A-pose. Mirroring still allowed (user-initiated).
- R3F components use `dynamic import` + `ssr: false` (existing Hero pattern).

---

### Task 1: Pure rig math + test infrastructure (`lib/poseRig.ts`)

Sets up Vitest and implements every pure function the humanoid needs: coordinate conversion, mirror, smoothing, confidence gating, segment transforms, head estimation, plus the segment/joint config and a static standby pose. This is where the math bugs live, so it is fully unit-tested.

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json` (add `test` script + `vitest` devDependency)
- Create: `lib/poseRig.ts`
- Test: `lib/poseRig.test.ts`

**Interfaces:**
- Consumes: `three` (`Vector3`, `Quaternion`).
- Produces (later tasks rely on these exact signatures):
  - `type Landmark = { x: number; y: number; z: number; visibility?: number }`
  - `type Vec3 = [number, number, number]`
  - `interface SegmentDef { a: number; b: number; radius: number }`
  - `interface JointDef { index: number; radius: number }`
  - `interface SegmentTransform { position: Vec3; quaternion: [number, number, number, number]; length: number }`
  - `const LM` (landmark index map), `const SEGMENTS: SegmentDef[]`, `const JOINTS: JointDef[]`, `const TORSO: { a: number; b: number; radius: number }`, `const STANDBY_POSE: Landmark[]`
  - `worldToScene(lms: Landmark[]): Landmark[]`
  - `mirrorLandmarks(lms: Landmark[]): Landmark[]`
  - `midpoint(a: Landmark, b: Landmark): Vec3`
  - `lerpLandmarks(prev: Landmark[] | null, cur: Landmark[], alpha: number): Landmark[]`
  - `isConfident(l: Landmark | undefined, threshold?: number): boolean`
  - `segmentTransform(start: Vec3, end: Vec3): SegmentTransform`
  - `estimateHead(nose: Landmark, earL: Landmark, earR: Landmark): { center: Vec3; radius: number }`
  - `breathingOffset(t: number): number`

- [ ] **Step 1: Install Vitest and add the test script**

Run:
```bash
npm install -D vitest
```
Then edit `package.json` `scripts` to add:
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

Create `lib/poseRig.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import {
  LM, SEGMENTS, JOINTS, TORSO, STANDBY_POSE,
  worldToScene, mirrorLandmarks, midpoint, lerpLandmarks,
  isConfident, segmentTransform, estimateHead, breathingOffset,
  type Landmark,
} from './poseRig'

const lm = (x: number, y: number, z: number, v = 1): Landmark => ({ x, y, z, visibility: v })

describe('worldToScene', () => {
  it('negates y (MediaPipe y-down → three y-up), keeps x and z', () => {
    const [p] = worldToScene([lm(1, 2, 3)])
    expect(p.x).toBe(1)
    expect(p.y).toBe(-2)
    expect(p.z).toBe(3)
  })
})

describe('mirrorLandmarks', () => {
  it('negates x, keeps y and z', () => {
    const [p] = mirrorLandmarks([lm(1, 2, 3)])
    expect(p.x).toBe(-1)
    expect(p.y).toBe(2)
    expect(p.z).toBe(3)
  })
})

describe('midpoint', () => {
  it('averages each axis', () => {
    expect(midpoint(lm(0, 0, 0), lm(2, 4, 6))).toEqual([1, 2, 3])
  })
})

describe('lerpLandmarks', () => {
  it('returns cur when prev is null', () => {
    const cur = [lm(1, 1, 1)]
    expect(lerpLandmarks(null, cur, 0.5)).toBe(cur)
  })
  it('returns cur when lengths differ', () => {
    const cur = [lm(1, 1, 1)]
    expect(lerpLandmarks([lm(0, 0, 0), lm(0, 0, 0)], cur, 0.5)).toBe(cur)
  })
  it('interpolates halfway at alpha 0.5', () => {
    const [p] = lerpLandmarks([lm(0, 0, 0)], [lm(2, 4, 6)], 0.5)!
    expect(p.x).toBe(1); expect(p.y).toBe(2); expect(p.z).toBe(3)
  })
})

describe('isConfident', () => {
  it('false for undefined', () => { expect(isConfident(undefined)).toBe(false) })
  it('false below threshold', () => { expect(isConfident(lm(0, 0, 0, 0.2), 0.5)).toBe(false) })
  it('true at/above threshold', () => { expect(isConfident(lm(0, 0, 0, 0.6), 0.5)).toBe(true) })
})

describe('segmentTransform', () => {
  it('aligned along +Y gives identity rotation, midpoint position, correct length', () => {
    const t = segmentTransform([0, 0, 0], [0, 2, 0])
    expect(t.length).toBeCloseTo(2)
    expect(t.position).toEqual([0, 1, 0])
    expect(t.quaternion[0]).toBeCloseTo(0)
    expect(t.quaternion[1]).toBeCloseTo(0)
    expect(t.quaternion[2]).toBeCloseTo(0)
    expect(Math.abs(t.quaternion[3])).toBeCloseTo(1)
  })
  it('perpendicular direction produces a non-identity rotation', () => {
    const t = segmentTransform([0, 0, 0], [2, 0, 0])
    expect(t.length).toBeCloseTo(2)
    expect(t.position).toEqual([1, 0, 0])
    // rotating +Y to +X is a 90° turn about Z
    expect(Math.abs(t.quaternion[3])).toBeCloseTo(Math.SQRT1_2, 3)
  })
})

describe('estimateHead', () => {
  it('centers between the ears with a positive radius', () => {
    const h = estimateHead(lm(0, 1, 0), lm(-0.1, 1, 0), lm(0.1, 1, 0))
    expect(h.center[0]).toBeCloseTo(0)
    expect(h.radius).toBeGreaterThan(0)
  })
})

describe('config integrity', () => {
  it('every SEGMENT/JOINT/TORSO index is a valid landmark 0..32', () => {
    const all = [
      ...SEGMENTS.flatMap(s => [s.a, s.b]),
      ...JOINTS.map(j => j.index),
      TORSO.a, TORSO.b,
    ]
    for (const i of all) { expect(i).toBeGreaterThanOrEqual(0); expect(i).toBeLessThanOrEqual(32) }
  })
  it('STANDBY_POSE has 33 landmarks and confident core joints', () => {
    expect(STANDBY_POSE).toHaveLength(33)
    expect(isConfident(STANDBY_POSE[LM.shoulderL])).toBe(true)
    expect(isConfident(STANDBY_POSE[LM.hipR])).toBe(true)
  })
})

describe('breathingOffset', () => {
  it('is bounded and varies with time', () => {
    expect(Math.abs(breathingOffset(0))).toBeLessThanOrEqual(0.05)
    expect(breathingOffset(0)).not.toBe(breathingOffset(1.3))
  })
})
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module './poseRig'` / exports undefined.

- [ ] **Step 5: Implement `lib/poseRig.ts`**

```ts
import { Vector3, Quaternion } from 'three'

export type Landmark = { x: number; y: number; z: number; visibility?: number }
export type Vec3 = [number, number, number]

export interface SegmentDef { a: number; b: number; radius: number }
export interface JointDef { index: number; radius: number }
export interface SegmentTransform {
  position: Vec3
  quaternion: [number, number, number, number]
  length: number
}

// MediaPipe Pose landmark indices (subset we use)
export const LM = {
  nose: 0, earL: 7, earR: 8,
  shoulderL: 11, shoulderR: 12,
  elbowL: 13, elbowR: 14,
  wristL: 15, wristR: 16,
  hipL: 23, hipR: 24,
  kneeL: 25, kneeR: 26,
  ankleL: 27, ankleR: 28,
} as const

export const SEGMENTS: SegmentDef[] = [
  { a: LM.shoulderL, b: LM.elbowL, radius: 0.055 },
  { a: LM.elbowL,    b: LM.wristL, radius: 0.045 },
  { a: LM.shoulderR, b: LM.elbowR, radius: 0.055 },
  { a: LM.elbowR,    b: LM.wristR, radius: 0.045 },
  { a: LM.hipL,      b: LM.kneeL,  radius: 0.07 },
  { a: LM.kneeL,     b: LM.ankleL, radius: 0.055 },
  { a: LM.hipR,      b: LM.kneeR,  radius: 0.07 },
  { a: LM.kneeR,     b: LM.ankleR, radius: 0.055 },
]

export const JOINTS: JointDef[] = [
  { index: LM.shoulderL, radius: 0.075 }, { index: LM.shoulderR, radius: 0.075 },
  { index: LM.elbowL, radius: 0.05 },     { index: LM.elbowR, radius: 0.05 },
  { index: LM.wristL, radius: 0.045 },    { index: LM.wristR, radius: 0.045 },
  { index: LM.hipL, radius: 0.08 },       { index: LM.hipR, radius: 0.08 },
  { index: LM.kneeL, radius: 0.06 },      { index: LM.kneeR, radius: 0.06 },
  { index: LM.ankleL, radius: 0.05 },     { index: LM.ankleR, radius: 0.05 },
]

// Torso: shoulder-mid → hip-mid, handled specially (endpoints are computed midpoints)
export const TORSO = { a: LM.shoulderL, b: LM.hipL, radius: 0.13 }

const DEFAULT_AXIS = new Vector3(0, 1, 0) // cylinder long axis is +Y

export const worldToScene = (lms: Landmark[]): Landmark[] =>
  lms.map(l => ({ ...l, y: -l.y }))

export const mirrorLandmarks = (lms: Landmark[]): Landmark[] =>
  lms.map(l => ({ ...l, x: -l.x }))

export const midpoint = (a: Landmark, b: Landmark): Vec3 =>
  [(a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2]

export const lerpLandmarks = (
  prev: Landmark[] | null,
  cur: Landmark[],
  alpha: number,
): Landmark[] => {
  if (!prev || prev.length !== cur.length) return cur
  return cur.map((c, i) => ({
    x: prev[i].x + (c.x - prev[i].x) * alpha,
    y: prev[i].y + (c.y - prev[i].y) * alpha,
    z: prev[i].z + (c.z - prev[i].z) * alpha,
    visibility: c.visibility,
  }))
}

export const isConfident = (l: Landmark | undefined, threshold = 0.5): boolean =>
  !!l && (l.visibility ?? 0) >= threshold

export function segmentTransform(start: Vec3, end: Vec3): SegmentTransform {
  const s = new Vector3(start[0], start[1], start[2])
  const e = new Vector3(end[0], end[1], end[2])
  const dir = e.clone().sub(s)
  const length = dir.length()
  const q = new Quaternion()
  if (length > 1e-6) q.setFromUnitVectors(DEFAULT_AXIS, dir.clone().normalize())
  const mid = s.clone().add(e).multiplyScalar(0.5)
  return {
    position: [mid.x, mid.y, mid.z],
    quaternion: [q.x, q.y, q.z, q.w],
    length,
  }
}

export function estimateHead(nose: Landmark, earL: Landmark, earR: Landmark) {
  const center: Vec3 = [
    (earL.x + earR.x) / 2,
    (earL.y + earR.y) / 2,
    (earL.z + earR.z) / 2 + (nose.z - (earL.z + earR.z) / 2) * 0.3,
  ]
  const earDist = Math.hypot(earL.x - earR.x, earL.y - earR.y, earL.z - earR.z)
  return { center, radius: Math.max(earDist * 0.85, 0.07) }
}

/** Gentle vertical bob for the idle/standby state (meters). */
export const breathingOffset = (t: number): number => Math.sin(t * 1.1) * 0.012

// Static relaxed A-pose in SCENE space (y up, meters, origin ~ hip center).
// Indices not used by SEGMENTS/JOINTS/head are filled with low-visibility zeros.
const zero: Landmark = { x: 0, y: 0, z: 0, visibility: 0 }
function buildStandby(): Landmark[] {
  const p: Landmark[] = Array.from({ length: 33 }, () => ({ ...zero }))
  const set = (i: number, x: number, y: number, z: number) => { p[i] = { x, y, z, visibility: 1 } }
  set(LM.nose, 0, 0.78, 0.06)
  set(LM.earL, -0.08, 0.75, 0); set(LM.earR, 0.08, 0.75, 0)
  set(LM.shoulderL, -0.20, 0.52, 0); set(LM.shoulderR, 0.20, 0.52, 0)
  set(LM.elbowL, -0.27, 0.30, 0);   set(LM.elbowR, 0.27, 0.30, 0)
  set(LM.wristL, -0.31, 0.09, 0);   set(LM.wristR, 0.31, 0.09, 0)
  set(LM.hipL, -0.11, 0.0, 0);      set(LM.hipR, 0.11, 0.0, 0)
  set(LM.kneeL, -0.12, -0.45, 0);   set(LM.kneeR, 0.12, -0.45, 0)
  set(LM.ankleL, -0.12, -0.88, 0);  set(LM.ankleR, 0.12, -0.88, 0)
  return p
}
export const STANDBY_POSE: Landmark[] = buildStandby()
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — all `poseRig` tests green.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vitest.config.ts lib/poseRig.ts lib/poseRig.test.ts
git commit -m "Add pose rig math + Vitest test infra"
```

---

### Task 2: Body-tracking singleton (`lib/bodyTracking.ts`)

Wraps MediaPipe PoseLandmarker in a start/stop/read singleton, mirroring the shape of the existing `lib/poseTracking.ts` (hand) module but for full-body world landmarks. Side-effecty (getUserMedia, WASM) so only a pre-start guard is unit-tested; the real verification is visual in Task 6.

**Files:**
- Create: `lib/bodyTracking.ts`
- Test: `lib/bodyTracking.test.ts`
- Reference (read for pattern, do not modify): `lib/poseTracking.ts`

**Interfaces:**
- Consumes: `@mediapipe/tasks-vision` (`PoseLandmarker`, `FilesetResolver`); `Landmark` type re-declared locally to match `poseRig`.
- Produces:
  - `getBodyWorldLandmarks(): Landmark[] | null` — latest 33 world landmarks (meters) or null.
  - `isBodyRunning(): boolean`
  - `startBody(): Promise<void>`
  - `stopBody(): void`
  - `pauseBody(): void` — stop the detect loop (keeps the camera stream) so scrolling the Hero out of view halts GPU inference.
  - `resumeBody(): void` — restart the detect loop if running and paused.

- [ ] **Step 1: Write the failing test**

Create `lib/bodyTracking.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { isBodyRunning, getBodyWorldLandmarks } from './bodyTracking'

describe('bodyTracking (pre-start state)', () => {
  it('is not running before startBody', () => {
    expect(isBodyRunning()).toBe(false)
  })
  it('returns null landmarks before startBody', () => {
    expect(getBodyWorldLandmarks()).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test lib/bodyTracking.test.ts`
Expected: FAIL — `Cannot find module './bodyTracking'`.

- [ ] **Step 3: Implement `lib/bodyTracking.ts`**

```ts
// MediaPipe Pose tracking singleton — full-body, 33 world landmarks.
// Drives the fur humanoid so it mirrors the user's body in real time.

import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

export type Landmark = { x: number; y: number; z: number; visibility?: number }

const WASM_CDN  = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm'
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'

let landmarker: PoseLandmarker | null = null
let video: HTMLVideoElement | null = null
let stream: MediaStream | null = null
let running = false
let paused = false
let rafId = 0
let lastVideoTime = -1
let latest: Landmark[] | null = null

/** Latest 33 world landmarks (meters, origin at hip center) or null. */
export function getBodyWorldLandmarks(): Landmark[] | null {
  return latest
}

export function isBodyRunning(): boolean {
  return running
}

export async function startBody(): Promise<void> {
  if (running) return

  const vision = await FilesetResolver.forVisionTasks(WASM_CDN)
  landmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
    runningMode: 'VIDEO',
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  })

  stream = await navigator.mediaDevices.getUserMedia({
    video: { width: 640, height: 480, facingMode: 'user' },
    audio: false,
  })
  video = document.createElement('video')
  video.srcObject = stream
  video.playsInline = true
  video.muted = true
  await video.play()

  running = true
  paused = false
  loop()
}

export function pauseBody(): void {
  paused = true
  cancelAnimationFrame(rafId)
}

export function resumeBody(): void {
  if (running && paused) { paused = false; loop() }
}

function loop() {
  if (!running || paused || !landmarker || !video) return
  if (video.currentTime !== lastVideoTime && video.readyState >= 2) {
    lastVideoTime = video.currentTime
    try {
      const res = landmarker.detectForVideo(video, performance.now())
      latest = res.worldLandmarks && res.worldLandmarks.length ? res.worldLandmarks[0] : null
    } catch {
      // transient detection errors — keep last frame
    }
  }
  rafId = requestAnimationFrame(loop)
}

export function stopBody(): void {
  running = false
  paused = false
  cancelAnimationFrame(rafId)
  latest = null
  lastVideoTime = -1

  if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null }
  if (video) { video.srcObject = null; video = null }
  if (landmarker) { landmarker.close(); landmarker = null }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test lib/bodyTracking.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/bodyTracking.ts lib/bodyTracking.test.ts
git commit -m "Add PoseLandmarker body-tracking singleton"
```

---

### Task 3: Shell fur material (`components/three/FurMaterial.ts`)

A `ShaderMaterial` factory rendering fur as N shells. Each shell is one instance (attribute `aShell`); the vertex shader pushes it outward along the normal by `aShell/(shells-1) * furLength`, adds gravity + time-based sway, and the fragment shader carves fur strands from tileable value noise, shading root→tip and adding a rim. Uniform defaults and clamping are unit-tested (constructing a `ShaderMaterial` needs no WebGL).

**Files:**
- Create: `components/three/FurMaterial.ts`
- Test: `components/three/FurMaterial.test.ts`

**Interfaces:**
- Consumes: `three`.
- Produces:
  - `interface FurOptions { shells?: number; furLength?: number; density?: number; rootColor?: THREE.ColorRepresentation; tipColor?: THREE.ColorRepresentation; gravity?: number; sway?: number }`
  - `createFurMaterial(opts?: FurOptions): THREE.ShaderMaterial` — material with uniforms `uShells, uFurLength, uDensity, uRootColor, uTipColor, uGravity, uSway, uTime`; `transparent=true`, `depthWrite=false`. Vertex shader reads instanced `attribute float aShell`.
  - `FUR_DEFAULTS` — the resolved default option values (so components stay in sync).

- [ ] **Step 1: Write the failing test**

Create `components/three/FurMaterial.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { createFurMaterial, FUR_DEFAULTS } from './FurMaterial'

describe('createFurMaterial', () => {
  it('returns a transparent, non-depth-writing ShaderMaterial', () => {
    const m = createFurMaterial()
    expect(m).toBeInstanceOf(THREE.ShaderMaterial)
    expect(m.transparent).toBe(true)
    expect(m.depthWrite).toBe(false)
  })
  it('uses default shell count when unspecified', () => {
    const m = createFurMaterial()
    expect(m.uniforms.uShells.value).toBe(FUR_DEFAULTS.shells)
  })
  it('applies a custom shell count', () => {
    const m = createFurMaterial({ shells: 6 })
    expect(m.uniforms.uShells.value).toBe(6)
  })
  it('clamps shells to at least 1', () => {
    const m = createFurMaterial({ shells: 0 })
    expect(m.uniforms.uShells.value).toBe(1)
  })
  it('stores colors as THREE.Color', () => {
    const m = createFurMaterial({ rootColor: '#122333', tipColor: '#8AAABF' })
    expect(m.uniforms.uRootColor.value).toBeInstanceOf(THREE.Color)
    expect(m.uniforms.uTipColor.value).toBeInstanceOf(THREE.Color)
  })
  it('declares the aShell attribute in the vertex shader', () => {
    const m = createFurMaterial()
    expect(m.vertexShader).toContain('aShell')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test components/three/FurMaterial.test.ts`
Expected: FAIL — `Cannot find module './FurMaterial'`.

- [ ] **Step 3: Implement `components/three/FurMaterial.ts`**

```ts
import * as THREE from 'three'

export interface FurOptions {
  shells?: number
  furLength?: number
  density?: number
  rootColor?: THREE.ColorRepresentation
  tipColor?: THREE.ColorRepresentation
  gravity?: number
  sway?: number
}

export const FUR_DEFAULTS = {
  shells: 16,
  furLength: 0.06,
  density: 90,
  rootColor: '#122333',
  tipColor: '#8AAABF',
  gravity: 0.02,
  sway: 0.01,
} as const

const vertexShader = /* glsl */`
  attribute float aShell;
  uniform float uShells;
  uniform float uFurLength;
  uniform float uGravity;
  uniform float uSway;
  uniform float uTime;
  varying float vLayer;
  varying vec2 vUv;
  varying vec3 vNormalW;

  void main() {
    vUv = uv;
    float layer = uShells > 1.0 ? aShell / (uShells - 1.0) : 0.0;
    vLayer = layer;
    vNormalW = normalize(mat3(modelMatrix) * normal);

    vec3 pos = position + normal * (uFurLength * layer);
    // gravity pulls tips down; sway wobbles them over time — both scale with layer^2
    float k = layer * layer;
    pos.y -= uGravity * k;
    pos.x += sin(uTime * 1.5 + position.y * 4.0) * uSway * k;
    pos.z += cos(uTime * 1.2 + position.x * 4.0) * uSway * k;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const fragmentShader = /* glsl */`
  precision highp float;
  uniform float uShells;
  uniform float uDensity;
  uniform vec3 uRootColor;
  uniform vec3 uTipColor;
  varying float vLayer;
  varying vec2 vUv;
  varying vec3 vNormalW;

  // cheap tileable value noise
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    float a = hash(i), b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  void main() {
    float strand = noise(vUv * uDensity);
    // base shell (layer 0) is solid skin; outer shells are carved into strands
    if (vLayer > 0.0 && strand < vLayer) discard;

    vec3 col = mix(uRootColor, uTipColor, vLayer);
    // fake rim light for a soft furry silhouette
    float rim = pow(1.0 - abs(vNormalW.z), 2.0);
    col += rim * 0.25 * uTipColor;
    // slight tip fade
    float alpha = vLayer > 0.0 ? (1.0 - vLayer * 0.35) : 1.0;
    gl_FragColor = vec4(col, alpha);
  }
`

export function createFurMaterial(opts: FurOptions = {}): THREE.ShaderMaterial {
  const shells = Math.max(1, Math.floor(opts.shells ?? FUR_DEFAULTS.shells))
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide,
    uniforms: {
      uShells:    { value: shells },
      uFurLength: { value: opts.furLength ?? FUR_DEFAULTS.furLength },
      uDensity:   { value: opts.density ?? FUR_DEFAULTS.density },
      uGravity:   { value: opts.gravity ?? FUR_DEFAULTS.gravity },
      uSway:      { value: opts.sway ?? FUR_DEFAULTS.sway },
      uTime:      { value: 0 },
      uRootColor: { value: new THREE.Color(opts.rootColor ?? FUR_DEFAULTS.rootColor) },
      uTipColor:  { value: new THREE.Color(opts.tipColor ?? FUR_DEFAULTS.tipColor) },
    },
  })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test components/three/FurMaterial.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/three/FurMaterial.ts components/three/FurMaterial.test.ts
git commit -m "Add shell fur ShaderMaterial"
```

---

### Task 4: Fur humanoid component (`components/three/FurHumanoid.tsx`)

Builds one fur-covered `InstancedMesh` per segment (cylinder), per joint (sphere), the torso (fat cylinder) and head (sphere). Each mesh holds `shells` instances all at identity matrix, plus an `aShell` instanced attribute `[0..shells-1]`; the whole mesh is positioned/oriented/scaled each frame from landmarks. Sourcing: `active` → body tracking (world → scene → mirror → smooth); otherwise `STANDBY_POSE` + breathing bob. Verified visually.

**Files:**
- Create: `components/three/FurHumanoid.tsx`

**Interfaces:**
- Consumes: `lib/poseRig` (`STANDBY_POSE, worldToScene, mirrorLandmarks, lerpLandmarks, segmentTransform, midpoint, estimateHead, isConfident, breathingOffset, SEGMENTS, JOINTS, TORSO, LM, type Landmark`); `lib/bodyTracking` (`getBodyWorldLandmarks`); `components/three/FurMaterial` (`createFurMaterial, FUR_DEFAULTS`); `@react-three/fiber` (`useFrame`); `three`.
- Produces: `FurHumanoid({ active, lowPower, reducedMotion }: { active: boolean; lowPower: boolean; reducedMotion: boolean })` — a group of R3F meshes; no imperative exports.

- [ ] **Step 1: Implement the component**

```tsx
'use client'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
  STANDBY_POSE, worldToScene, mirrorLandmarks, lerpLandmarks,
  segmentTransform, midpoint, estimateHead, isConfident, breathingOffset,
  SEGMENTS, JOINTS, TORSO, LM, type Landmark,
} from '@/lib/poseRig'
import { getBodyWorldLandmarks } from '@/lib/bodyTracking'
import { createFurMaterial, FUR_DEFAULTS } from './FurMaterial'

const IDENTITY = new THREE.Matrix4()

// Build a cylinder (unit height, along +Y) or sphere geometry with an aShell attribute.
function withShells(geo: THREE.BufferGeometry, shells: number) {
  const arr = new Float32Array(shells)
  for (let i = 0; i < shells; i++) arr[i] = i
  geo.setAttribute('aShell', new THREE.InstancedBufferAttribute(arr, 1))
  return geo
}

export function FurHumanoid({
  active, lowPower, reducedMotion,
}: { active: boolean; lowPower: boolean; reducedMotion: boolean }) {
  const shells = lowPower ? 6 : 16
  const groupRef = useRef<THREE.Group>(null)
  const prevPose = useRef<Landmark[] | null>(null)

  const material = useMemo(
    () => createFurMaterial({
      shells,
      furLength: FUR_DEFAULTS.furLength,
      sway: reducedMotion ? 0 : FUR_DEFAULTS.sway,
    }),
    [shells, reducedMotion],
  )

  // One InstancedMesh (shells instances) per limb segment, joint, torso, head.
  const limbs = useMemo(() => SEGMENTS.map(s => {
    const geo = withShells(new THREE.CylinderGeometry(s.radius, s.radius, 1, 10, 1, true), shells)
    const mesh = new THREE.InstancedMesh(geo, material, shells)
    for (let i = 0; i < shells; i++) mesh.setMatrixAt(i, IDENTITY)
    mesh.instanceMatrix.needsUpdate = true
    return mesh
  }), [material, shells])

  const joints = useMemo(() => JOINTS.map(j => {
    const geo = withShells(new THREE.SphereGeometry(j.radius, 12, 10), shells)
    const mesh = new THREE.InstancedMesh(geo, material, shells)
    for (let i = 0; i < shells; i++) mesh.setMatrixAt(i, IDENTITY)
    mesh.instanceMatrix.needsUpdate = true
    return mesh
  }), [material, shells])

  const torso = useMemo(() => {
    const geo = withShells(new THREE.CylinderGeometry(TORSO.radius, TORSO.radius * 0.85, 1, 12, 1, true), shells)
    const mesh = new THREE.InstancedMesh(geo, material, shells)
    for (let i = 0; i < shells; i++) mesh.setMatrixAt(i, IDENTITY)
    mesh.instanceMatrix.needsUpdate = true
    return mesh
  }, [material, shells])

  const head = useMemo(() => {
    const geo = withShells(new THREE.SphereGeometry(1, 16, 14), shells)
    const mesh = new THREE.InstancedMesh(geo, material, shells)
    for (let i = 0; i < shells; i++) mesh.setMatrixAt(i, IDENTITY)
    mesh.instanceMatrix.needsUpdate = true
    return mesh
  }, [material, shells])

  const q = useMemo(() => new THREE.Quaternion(), [])

  useFrame((_, delta) => {
    material.uniforms.uTime.value += delta

    // 1. Source the pose
    let pose: Landmark[]
    if (active) {
      const raw = getBodyWorldLandmarks()
      if (raw && raw.length === 33) {
        const scene = mirrorLandmarks(worldToScene(raw))
        pose = lerpLandmarks(prevPose.current, scene, 0.4)
      } else {
        pose = prevPose.current ?? STANDBY_POSE
      }
    } else {
      const bob = reducedMotion ? 0 : breathingOffset(material.uniforms.uTime.value)
      pose = STANDBY_POSE.map(l => ({ ...l, y: l.y + bob }))
    }
    prevPose.current = pose

    const place = (mesh: THREE.InstancedMesh, pos: [number, number, number], quat: THREE.Quaternion, sx: number, sy: number, sz: number) => {
      mesh.position.set(pos[0], pos[1], pos[2])
      mesh.quaternion.copy(quat)
      mesh.scale.set(sx, sy, sz)
    }

    // 2. Limbs — cylinder spans start→end (freeze on low confidence)
    SEGMENTS.forEach((s, i) => {
      const a = pose[s.a], b = pose[s.b]
      if (!isConfident(a) || !isConfident(b)) return
      const t = segmentTransform([a.x, a.y, a.z], [b.x, b.y, b.z])
      q.set(t.quaternion[0], t.quaternion[1], t.quaternion[2], t.quaternion[3])
      place(limbs[i], t.position, q, 1, t.length, 1)
    })

    // 3. Joints — spheres at each landmark
    JOINTS.forEach((j, i) => {
      const p = pose[j.index]
      if (!isConfident(p)) return
      place(joints[i], [p.x, p.y, p.z], new THREE.Quaternion(), 1, 1, 1)
    })

    // 4. Torso — shoulder-mid → hip-mid
    const shMid = midpoint(pose[LM.shoulderL], pose[LM.shoulderR])
    const hipMid = midpoint(pose[LM.hipL], pose[LM.hipR])
    const tt = segmentTransform(shMid, hipMid)
    q.set(tt.quaternion[0], tt.quaternion[1], tt.quaternion[2], tt.quaternion[3])
    place(torso, tt.position, q, 1, tt.length, 1)

    // 5. Head — sphere scaled to estimated radius
    const h = estimateHead(pose[LM.nose], pose[LM.earL], pose[LM.earR])
    place(head, h.center, new THREE.Quaternion(), h.radius, h.radius, h.radius)
  })

  return (
    <group ref={groupRef}>
      {limbs.map((m, i) => <primitive key={`l${i}`} object={m} />)}
      {joints.map((m, i) => <primitive key={`j${i}`} object={m} />)}
      <primitive object={torso} />
      <primitive object={head} />
    </group>
  )
}
```

- [ ] **Step 2: Typecheck & lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no type errors in `FurHumanoid.tsx`, no lint errors.

- [ ] **Step 3: Commit**

```bash
git add components/three/FurHumanoid.tsx
git commit -m "Add fur humanoid component (landmark-driven segments)"
```

---

### Task 5: Fur humanoid scene (`components/three/FurHumanoidScene.tsx`)

The Canvas host — camera, fur-flattering lights, device-tier `dpr`/`antialias`, and `frameloop` gated by `inView`. Reads `prefers-reduced-motion` and passes it down. Same prop shape (`active`, `inView`, `lowPower`) as the `NoiseBlobScene` it replaces, so `HeroSection` swaps cleanly.

**Files:**
- Create: `components/three/FurHumanoidScene.tsx`
- Reference (read for camera/gl/frameloop pattern): `components/three/NoiseBlobScene.tsx`

**Interfaces:**
- Consumes: `@react-three/fiber` (`Canvas`); `components/three/FurHumanoid` (`FurHumanoid`).
- Produces: `FurHumanoidScene({ active, inView, lowPower }: { active?: boolean; inView?: boolean; lowPower?: boolean })`.

- [ ] **Step 1: Implement the scene**

```tsx
'use client'
import { useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { FurHumanoid } from './FurHumanoid'

export function FurHumanoidScene({
  active = false, inView = true, lowPower = false,
}: { active?: boolean; inView?: boolean; lowPower?: boolean }) {
  const [reducedMotion, setReducedMotion] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return (
    <Canvas
      camera={{ position: [0, 0.1, lowPower ? 3.2 : 2.6], fov: 42 }}
      gl={{ antialias: !lowPower, alpha: true, premultipliedAlpha: false }}
      dpr={lowPower ? 1 : [1, 2]}
      frameloop={inView ? 'always' : 'never'}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 3, 4]} intensity={1.1} />
      <directionalLight position={[-3, 1, -2]} intensity={0.5} color="#A0C4D8" />
      <FurHumanoid active={active} lowPower={lowPower} reducedMotion={reducedMotion} />
    </Canvas>
  )
}
```

- [ ] **Step 2: Typecheck & lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add components/three/FurHumanoidScene.tsx
git commit -m "Add fur humanoid Canvas scene"
```

---

### Task 6: Wire into Hero + switch WebcamToggle to body tracking

Swap the Hero's 3D scene from `NoiseBlobScene` to `FurHumanoidScene`, and point `WebcamToggle` at `startBody`/`stopBody` so the toggle now starts full-body tracking. This is the end-to-end integration; verified by running the app.

**Files:**
- Modify: `components/sections/HeroSection.tsx:53-56` (dynamic import), `:146` (usage)
- Modify: `components/ui/WebcamToggle.tsx:3` (import), and its start/stop calls

**Interfaces:**
- Consumes: `components/three/FurHumanoidScene` (`FurHumanoidScene`); `lib/bodyTracking` (`startBody`, `stopBody`, `pauseBody`, `resumeBody`).
- Produces: none (integration).

- [ ] **Step 1: Point WebcamToggle at body tracking**

In `components/ui/WebcamToggle.tsx`, change the import:
```tsx
import { startBody, stopBody } from '@/lib/bodyTracking'
```
Then replace the `startPose()` call with `startBody()` and the `stopPose()` call with `stopBody()` (keep all surrounding toggle/aria/keyboard logic unchanged).

- [ ] **Step 2: Swap the Hero scene**

In `components/sections/HeroSection.tsx`, replace the dynamic import (lines 53-56):
```tsx
const FurHumanoidScene = dynamic(
  () => import('@/components/three/FurHumanoidScene').then(m => m.FurHumanoidScene),
  { ssr: false }
)
```
And replace the usage (line 146):
```tsx
        <FurHumanoidScene active={cam} inView={inView} lowPower={lowPower} />
```
Leave the `blobRef` wrapper, gradients, `ParticleCursor`, text, and `WebcamToggle` as-is.

- [ ] **Step 3: Pause body detection when the Hero scrolls out of view**

Add this import near the top of `components/sections/HeroSection.tsx`:
```tsx
import { pauseBody, resumeBody } from '@/lib/bodyTracking'
```
Then add an effect inside the `HeroSection` component (alongside the other `useEffect`s), so detection halts off-screen and resumes when the Hero returns while the camera is on:
```tsx
  useEffect(() => {
    if (!cam) return
    if (inView) resumeBody()
    else pauseBody()
  }, [cam, inView])
```

- [ ] **Step 4: Typecheck, lint, and full test run**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: clean; all Vitest suites pass.

- [ ] **Step 5: Visual verification (manual)**

Run: `npm run dev`, open the home page. Confirm, and capture a screenshot if possible:
1. On load (no camera): a shaggy blue-gray fur figure stands and gently breathes/sways.
2. Reduced motion (OS setting on): figure is static, no sway.
3. Click the webcam toggle, grant permission: the figure mirrors your body — raise your right arm, its right arm raises; the joint seams stay hidden under fur.
4. Scroll the hero out of view and back: rendering pauses/resumes without error (check console).
5. Narrow the window to a mobile width / reload on a phone: still renders, lower fur density, no jank.

If any check fails, debug before committing (this step has no code change to commit unless a fix is needed).

- [ ] **Step 6: Commit**

```bash
git add components/sections/HeroSection.tsx components/ui/WebcamToggle.tsx
git commit -m "Wire fur humanoid into Hero; toggle starts body tracking"
```

---

## Notes / Known Follow-ups (out of scope for this plan)

- The dormant `NoiseBlob*`, `SplinterSystem`, `BlobTrail`, `handGestures`, and hand `poseTracking` files remain in the tree. A later cleanup can delete them once confirmed unused elsewhere.
- MediaPipe world-landmark depth (z) is noisier than x/y; if depth wobble is distracting, add a stronger per-axis smoothing (lower alpha for z) in `FurHumanoid` step 1 — the `lerpLandmarks` seam is the place to extend.
- If fur reads too sparse/dense, tune `FUR_DEFAULTS.density` / `furLength` in `FurMaterial.ts`.
