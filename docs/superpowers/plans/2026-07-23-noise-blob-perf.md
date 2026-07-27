# Noise Blob 效能優化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓 Hero 的 noise blob 在每台裝置(含低階手機)流暢跑,做法是砍 shader 計算量、保持解析度清晰、並用實測 FPS 自動降級。

**Architecture:** 引入 `quality` 三級制(`3=high` / `2=mid` / `1=low`)。一份 `lib/blobQuality.ts` 集中每級的參數(幾何 detail、DPR 上限、antialias)並提供純函式做 tier 降級決策。`lib/useAdaptiveQuality.ts` 用 requestAnimationFrame 量測 FPS,掉幀時只降不升。Shader 用 `#define QUALITY n` 在編譯期分支(避免 GPU 動態分支),`NoiseBlob` 依 quality 產生對應 shader。`NoiseBlobScene` 依 quality 設定 DPR/antialias,`HeroSection` 偵測初始 tier 並掛量測器。

**Tech Stack:** Next.js 16、React Three Fiber、Three.js ShaderMaterial(GLSL1 + `#define`/`#if` 前處理)、TypeScript。

## Global Constraints

- **不砍解析度換效能。** DPR 用 `Math.min(window.devicePixelRatio, cap)`,cap 不低於 1.75;絕不固定為 1。
- **效能靠減 shader 計算量。** 弱機一樣滿解析度、邊緣平滑。
- **只降不升。** FPS 降級單向,降到 `low`(1)為底,不做升級以免震盪。
- **shader 分支用編譯期 `#define`,不用執行期 `if` uniform 分支。**
- **`prefers-reduced-motion` 既有降級行為不可破壞。**
- 無測試框架:純邏輯用 pure function + `npm run build` 型別檢查驗證;視覺/shader 用 build + lint + dev server 目視 + FPS console 驗證。
- Client 元件維持 `'use client'`;three 元件維持 `dynamic import` + `ssr: false`(既有)。

---

## File Structure

- `lib/blobQuality.ts` — **新增**。`Quality` 型別、`QUALITY_CONFIG` 每級參數、`downgrade()` / `decideTier()` 純函式。
- `lib/useAdaptiveQuality.ts` — **新增**。rAF FPS 量測 hook,回傳目前 `Quality`,掉幀時呼叫 `downgrade`。
- `components/three/NoiseBlob.tsx` — **修改**。shader 加 `#define QUALITY`;noise 層數、法線梯度、光源、specular 依 `#if QUALITY` 分支;`detail` prop 保留但由呼叫端依 quality 給。
- `components/three/NoiseBlobScene.tsx` — **修改**。`lowPower: boolean` prop 換成 `quality: Quality`;DPR/antialias/detail 由 `QUALITY_CONFIG` 決定。
- `components/sections/HeroSection.tsx` — **修改**。初始 tier 偵測 + `useAdaptiveQuality`;把 `quality` 傳給 scene;`ParticleCursor` 顯示條件改為 `quality >= 3`。

---

## Task 1: Quality tier 設定與降級純函式

**Files:**
- Create: `lib/blobQuality.ts`

**Interfaces:**
- Produces:
  - `type Quality = 1 | 2 | 3`(1=low, 2=mid, 3=high)
  - `interface QualityConfig { detail: number; dprCap: number; antialias: boolean }`
  - `const QUALITY_CONFIG: Record<Quality, QualityConfig>`
  - `function downgrade(q: Quality): Quality` — 回傳低一階,已在 `1` 則回 `1`。
  - `function decideTier(): Quality` — 依環境(SSR safe)回初始 tier:`window` 不存在或窄螢幕/`pointer: coarse` → `2`,否則 `3`。

- [ ] **Step 1: 建立 lib/blobQuality.ts**

```ts
// lib/blobQuality.ts
export type Quality = 1 | 2 | 3 // 1=low, 2=mid, 3=high

export interface QualityConfig {
  detail: number      // icosahedron subdivision
  dprCap: number      // upper bound for devicePixelRatio — 絕不 < 1.75
  antialias: boolean
}

export const QUALITY_CONFIG: Record<Quality, QualityConfig> = {
  3: { detail: 5, dprCap: 2,    antialias: true },
  2: { detail: 4, dprCap: 2,    antialias: true },
  1: { detail: 3, dprCap: 1.75, antialias: false },
}

/** 降一階,已到 low 就維持 low。只降不升。 */
export function downgrade(q: Quality): Quality {
  return (q > 1 ? q - 1 : 1) as Quality
}

/** 初始 tier。SSR-safe:無 window 時回 high(3),不影響 first paint。 */
export function decideTier(): Quality {
  if (typeof window === 'undefined') return 3
  const weak = window.matchMedia('(max-width: 768px), (pointer: coarse)').matches
  return weak ? 2 : 3
}
```

- [ ] **Step 2: 型別檢查通過**

Run: `npm run build`
Expected: 編譯成功(此檔僅型別/常數,無 runtime 依賴)。若只想快查型別可 `npx tsc --noEmit`(若可用),否則以 `npm run build` 為準。

- [ ] **Step 3: 肉眼驗證純函式邏輯**

確認:`downgrade(3)===2`、`downgrade(2)===1`、`downgrade(1)===1`;`QUALITY_CONFIG[1].dprCap === 1.75`(符合「不砍解析度」約束,未低於 1.75);`decideTier` 在無 window 回 3。

- [ ] **Step 4: Commit**

```bash
git add lib/blobQuality.ts
git commit -m "Add blob quality tiers and downgrade logic"
```

---

## Task 2: FPS 自動降級 hook

**Files:**
- Create: `lib/useAdaptiveQuality.ts`

**Interfaces:**
- Consumes: `Quality`, `downgrade`, `decideTier` from `lib/blobQuality.ts`.
- Produces: `function useAdaptiveQuality(enabled: boolean): Quality` — 回傳目前 tier。`enabled=false`(如 reduced-motion 或離開視窗)時停止量測。

**設計說明:** 用 `requestAnimationFrame` 累積每秒 frame 數(rolling window ~90 frames)。當視窗平均 FPS < 45 且該 tier 已穩定量測一段時間(至少收集滿一個 window)→ `downgrade` 一次,並清空 window 重新量測。只降不升。SSR 期間回初始 `decideTier()`。

- [ ] **Step 1: 建立 lib/useAdaptiveQuality.ts**

```ts
// lib/useAdaptiveQuality.ts
'use client'
import { useEffect, useRef, useState } from 'react'
import { type Quality, downgrade, decideTier } from './blobQuality'

const WINDOW = 90          // frames to average before judging
const MIN_FPS = 45         // below this → downgrade

export function useAdaptiveQuality(enabled: boolean): Quality {
  const [tier, setTier] = useState<Quality>(3)
  const tierRef = useRef<Quality>(3)

  // Pick real initial tier on mount (avoids SSR/client mismatch — starts at 3 then settles)
  useEffect(() => {
    const t = decideTier()
    tierRef.current = t
    setTier(t)
  }, [])

  useEffect(() => {
    if (!enabled) return
    let raf = 0
    let frames = 0
    let start = performance.now()

    const loop = () => {
      frames++
      if (frames >= WINDOW) {
        const now = performance.now()
        const fps = (frames * 1000) / (now - start)
        frames = 0
        start = now
        if (fps < MIN_FPS && tierRef.current > 1) {
          const next = downgrade(tierRef.current)
          tierRef.current = next
          setTier(next)
        }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [enabled])

  return tier
}
```

- [ ] **Step 2: 型別/編譯檢查**

Run: `npm run build`
Expected: 編譯成功,無型別錯誤。

- [ ] **Step 3: 肉眼驗證邏輯**

確認:量滿 90 frames 才判斷;`fps < 45` 且 `tier > 1` 才降;`downgrade` 單向;`enabled=false` 時 effect 直接 return 不量測;cleanup 有 `cancelAnimationFrame`。

- [ ] **Step 4: Commit**

```bash
git add lib/useAdaptiveQuality.ts
git commit -m "Add FPS-based adaptive quality hook"
```

---

## Task 3: NoiseBlob shader 依 quality 分級

**Files:**
- Modify: `components/three/NoiseBlob.tsx`

**Interfaces:**
- Consumes: `Quality` from `lib/blobQuality.ts`(新 import)。
- Produces: `NoiseBlob` 新增 prop `quality: Quality`(取代原本僅用 `detail` 推斷 lowPower 的隱含關係);`detail` prop 保留由呼叫端傳。material 以 `defines={{ QUALITY: quality }}` 注入編譯期常數,並以 `key={quality}` 迫使 tier 改變時重編 shader。

**設計說明:** three.js `ShaderMaterial` 的 `defines` 會在 GLSL 前面注入 `#define QUALITY <n>`。用 `#if QUALITY >= n` 分支:noise 層數、法線梯度取樣、光源數、高次方 specular。GLSL1 前處理器支援 `#if`。tier 改變時 `key` 變 → React 重建 material → shader 重編(頻率極低,可接受)。

- [ ] **Step 1: sampleNoise 依 QUALITY 減層**

把 vertex shader 內的 `sampleNoise` 改為(用 `#if`):

```glsl
  float sampleNoise(vec3 p){
    float n = snoise(p*0.6+uTime*0.22)*0.6
            + snoise(p*1.1-uTime*0.16)*0.3;
  #if QUALITY >= 3
    n += snoise(p*2.2+uTime*0.35)*0.1;   // 第三層細節僅 high
  #endif
    return n;
  }
```

- [ ] **Step 2: 法線梯度依 QUALITY 減 tap**

把 vertex shader 內原本 6-tap 中央差分的 `grad` 區塊改為:

```glsl
    // ── Recalculate displaced normals ──────────────────────────
    float e = 0.025;
  #if QUALITY >= 3
    // 6-tap central difference — 最平滑
    vec3 grad = vec3(
      sampleNoise(position+vec3(e,0,0)) - sampleNoise(position-vec3(e,0,0)),
      sampleNoise(position+vec3(0,e,0)) - sampleNoise(position-vec3(0,e,0)),
      sampleNoise(position+vec3(0,0,e)) - sampleNoise(position-vec3(0,0,e))
    ) / (2.0*e);
  #else
    // 3-tap forward difference — 重用已算的 n,省一半取樣
    vec3 grad = vec3(
      sampleNoise(position+vec3(e,0,0)) - n,
      sampleNoise(position+vec3(0,e,0)) - n,
      sampleNoise(position+vec3(0,0,e)) - n
    ) / e;
  #endif
```

(註:`n` 已於函式開頭 `float n = sampleNoise(pos);` 算出且 `pos==position`,可重用。)

- [ ] **Step 3: fragment 光源數依 QUALITY 分級**

fragment shader 中,`L1` 一律計算;`L2` 包在 `#if QUALITY >= 2`;`L3` 包在 `#if QUALITY >= 3`。對應 `NdotL2/NdotL3`、`diffuse`、`s2/s3/s4`、rim 用到的項目一併以 `#if` 包起,未定義時以 0 代入。具體改法:

```glsl
    float NdotL1 = max(dot(N, L1pos), 0.0);
  #if QUALITY >= 2
    float NdotL2 = max(dot(N, L2pos), 0.0);
  #else
    float NdotL2 = 0.0;
  #endif
  #if QUALITY >= 3
    float NdotL3 = max(dot(N, L3pos), 0.0);
  #else
    float NdotL3 = 0.0;
  #endif
```

且把 `L2pos`/`L3pos` 的計算也各自包進對應 `#if`(未使用時不算,省 sin/cos)。`diffuse` 維持原式(NdotL2/NdotL3 為 0 時自然不貢獻)。

- [ ] **Step 4: specular 依 QUALITY 分級**

把 specular 區塊改為:

```glsl
    float s1 = spec(N, L1pos, V, 300.0) * NdotL1;
  #if QUALITY >= 2
    float s3 = spec(N, L2pos, V, 160.0) * NdotL2 * 0.55;
  #else
    float s3 = 0.0;
  #endif
  #if QUALITY >= 3
    float s2 = spec(N, L1pos, V,  56.0) * NdotL1 * 0.30;
    float s4 = spec(N, L3pos, V,  90.0) * NdotL3 * 0.32;
  #else
    float s2 = 0.0;
    float s4 = 0.0;
  #endif
```

(high-power `s1` 保留於所有 tier — 它是主高光,拿掉球會失去金屬感;真正貴的是多光疊加,已由 s2/s3/s4 分級處理。)

- [ ] **Step 5: 元件簽名加 quality,material 注入 defines**

修改 `NoiseBlob` 參數與 `shaderMaterial`:

```tsx
import { type Quality } from '@/lib/blobQuality'
// ...
export function NoiseBlob({
  spawnRef, posRef, active = false, offset = [0, 0],
  scaleFactor = 1, frozenRef, detail = 5, quality = 3,
}: {
  spawnRef?: React.MutableRefObject<SpawnFn | undefined>
  posRef?: React.MutableRefObject<THREE.Vector3>
  active?: boolean
  offset?: [number, number]
  scaleFactor?: number
  frozenRef?: React.MutableRefObject<boolean>
  detail?: number
  quality?: Quality
}) {
```

`shaderMaterial` 加 `defines` 與 `key`:

```tsx
      <shaderMaterial
        key={quality}
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        defines={{ QUALITY: quality }}
        side={THREE.FrontSide}
      />
```

- [ ] **Step 6: build 驗證 shader 編譯**

Run: `npm run build`
Expected: 編譯成功。(shader 語法錯誤在 runtime 才會爆,故 Step 7 需 dev server 目視。)

- [ ] **Step 7: dev server 目視三級 shader**

Run: `npm run dev`,瀏覽器開首頁。暫時在 `NoiseBlobScene` 手動硬給 `quality={1}`、`{2}`、`{3}` 各看一次(或用 React devtools),確認:
- 三級都能 render、無 GLSL 編譯錯誤(console 無 `THREE.WebGLProgram` shader error)。
- 邊緣平滑不鋸齒;low 版顏色/光影略簡但仍是同一顆球。
驗證後移除硬寫值。

- [ ] **Step 8: Commit**

```bash
git add components/three/NoiseBlob.tsx
git commit -m "Tier noise blob shader cost by quality define"
```

---

## Task 4: NoiseBlobScene 接 quality(取代 lowPower)

**Files:**
- Modify: `components/three/NoiseBlobScene.tsx`

**Interfaces:**
- Consumes: `Quality`, `QUALITY_CONFIG` from `lib/blobQuality.ts`;`NoiseBlob` 的 `quality`/`detail` props(Task 3)。
- Produces: `NoiseBlobScene` prop 由 `lowPower?: boolean` 改為 `quality?: Quality`(預設 `3`)。Canvas 的 `dpr`/`antialias`/相機 z 與 blob `detail`/`quality` 全依 `QUALITY_CONFIG[quality]`。

- [ ] **Step 1: 改 props 與 Canvas 設定**

```tsx
import { type Quality, QUALITY_CONFIG } from '@/lib/blobQuality'
// ...
export function NoiseBlobScene({
  active = false,
  inView = true,
  quality = 3,
}: {
  active?: boolean
  inView?: boolean
  quality?: Quality
}) {
  const cfg = QUALITY_CONFIG[quality]
  // ...(其餘 state/refs 不變)
  return (
    <Canvas
      camera={{ position: [0, 0, quality === 1 ? 8 : 6], fov: 40 }}
      gl={{ antialias: cfg.antialias, alpha: true, premultipliedAlpha: false }}
      dpr={[1, cfg.dprCap]}
      frameloop={inView ? 'always' : 'never'}
      style={{ background: 'transparent' }}
    >
```

(說明:`dpr={[1, cfg.dprCap]}` 讓 R3F 用真實 devicePixelRatio 但設上限 → 保清晰、不固定壓成 1。)

- [ ] **Step 2: blob 傳 detail + quality**

```tsx
        <NoiseBlob
          key={i}
          spawnRef={i === 0 ? spawnRef : undefined}
          posRef={i === 0 ? posRef : undefined}
          active={active}
          offset={b.offset}
          scaleFactor={b.scale}
          frozenRef={frozenRef}
          detail={cfg.detail}
          quality={quality}
        />
```

- [ ] **Step 3: build 驗證**

Run: `npm run build`
Expected: 編譯成功,無 `lowPower` 殘留型別錯誤。

- [ ] **Step 4: Commit**

```bash
git add components/three/NoiseBlobScene.tsx
git commit -m "Drive blob scene DPR and detail from quality tier"
```

---

## Task 5: HeroSection 掛自動降級並下傳 quality

**Files:**
- Modify: `components/sections/HeroSection.tsx`

**Interfaces:**
- Consumes: `useAdaptiveQuality`(Task 2)、`Quality`(型別)、`NoiseBlobScene` 的 `quality` prop(Task 4)。
- Produces: 移除舊 `lowPower` state 與其 `matchMedia` effect;改用 `const quality = useAdaptiveQuality(inView)`。`ParticleCursor` 顯示條件改 `quality >= 3`。

- [ ] **Step 1: 換掉 lowPower 為 useAdaptiveQuality**

移除:

```tsx
  const [lowPower, setLowPower] = useState(false)

  // Detect mobile / touch devices to reduce 3D cost
  useEffect(() => {
    setLowPower(window.matchMedia('(max-width: 768px), (pointer: coarse)').matches)
  }, [])
```

新增(import 區加 `import { useAdaptiveQuality } from '@/lib/useAdaptiveQuality'`),在 `inView` state 宣告之後:

```tsx
  // FPS-adaptive quality — starts from device heuristic, downgrades on frame drops.
  // Only measures while the hero is in view (paired with the render loop).
  const quality = useAdaptiveQuality(inView)
```

- [ ] **Step 2: 下傳 quality、改 ParticleCursor 條件**

Scene:

```tsx
        <NoiseBlobScene active={cam} inView={inView} quality={quality} />
```

ParticleCursor(桌機才顯示的重效果,對應 high tier):

```tsx
      {quality >= 3 && <ParticleCursor />}
```

- [ ] **Step 3: build + lint**

Run: `npm run build && npm run lint`
Expected: 編譯與 lint 均通過,無 `lowPower` / 未使用 import 殘留。

- [ ] **Step 4: dev server 端到端目視 + FPS**

Run: `npm run dev`。首頁確認球正常;開 devtools performance 或在 hook 內暫時 `console.log(fps)` 觀察量測運作。用瀏覽器 device toolbar 或節流模擬弱機,確認掉幀時 tier 會自動下降(可暫時 log tier 變化),球仍清晰不鋸齒。驗證後移除任何暫時 log。

- [ ] **Step 5: Commit**

```bash
git add components/sections/HeroSection.tsx
git commit -m "Wire hero to FPS-adaptive blob quality"
```

---

## Self-Review notes

- **Spec 覆蓋:** 幾何/noise/法線/光源/specular 分級 → Task 3;DPR 上限保清晰 + antialias → Task 4;FPS 自動降級只降不升 → Task 2；初始 tier 偵測 → Task 1(`decideTier`)+ Task 2。reduced-motion:既有邏輯未被本計畫觸及(HeroSection 未含 reduced-motion 分支,球的動畫節流由現有機制處理),`useAdaptiveQuality(enabled)` 的 `enabled` 綁 `inView`,不破壞既有降級。
- **不做:** 靜態圖 fallback、升級邏輯、particle/splinter/webcam 改動 — 均未納入,符合 spec YAGNI。
- **型別一致:** `Quality`、`QUALITY_CONFIG`、`downgrade`、`decideTier`、`useAdaptiveQuality`、`quality` prop 命名跨 Task 一致。
- **注意:** 移除 `lowPower` 後需確認無其他檔案 import 或傳入該 prop(執行 Task 4/5 時 grep 確認 `lowPower` 已無殘留)。
