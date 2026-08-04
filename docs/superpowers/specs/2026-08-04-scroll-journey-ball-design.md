# Scroll Journey Ball — 設計 Spec

日期:2026-08-04
狀態:設計定案,待寫實作計畫
依賴:接在 `feature/visionos-glass-hero`(純藍 noise ball、藍色 UnifiedTrajectory、liquid glass)之上。

---

## 1. 目標

把首頁的 noise ball 從「只待在 Hero 的一顆球」升級成**一顆跨整頁、隨捲動旅行並變形的持久 3D 元素**:

- 更**半透明**,內容從球後透出。
- 從 Hero **一路延續**:漂到 About 中間 → 在專案區縮成小球騎現有藍色曲線軌跡 → 帶過 Marquee/Dance → 在 **footer 溶解成發光藍粒子球**停駐。
- 全程是**一顆**球(同一元素縮放/移動/變形),不是多顆或淡出重生。

### 明確不做(YAGNI)
- 不做多顆球、不做每區塊各自的獨立球。
- footer 只做「實心球溶解成粒子球」一種結尾(不做爆散粒子雲)。
- 不改內容文案、不動 i18n/路由/Payload。
- 暫不處理其他路由頁(/about、/work、/dance)的球;此功能只在首頁。

---

## 2. 行為(4 段,捲動驅動)

一顆球,螢幕位置 / 縮放 / 透明度 / morph 全由捲動進度驅動:

| 段 | 區塊 | 球的狀態 |
|----|------|---------|
| 1 | Hero | 大球、半透明(~0.6)、置中偏後;保留現有滑鼠互動與 noise 變形。 |
| 2 | About(ProfileSection) | 隨捲動往下漂移到 ProfileSection 的**垂直中間**;到中間附近開始縮小。 |
| 3 | 專案(ProjectsSection) | **縮成小球**,騎在現有 UnifiedTrajectory 的藍色曲線軌跡上一路下行(保留軌跡線,移除舊 DOM 小球)。 |
| 4 | Marquee → Dance → Footer | 帶著小球繼續下行;接近 footer 時 **morph:實心 mesh 溶解成發光藍粒子球**,輕輕旋轉/浮動停在 footer。 |

- 全程在**內容後方**(文字/卡片蓋在球上),球從半透明區塊後透出。
- 透明度 `uOpacity` 預設 ~0.6,可即時微調;邊緣 Fresnel 亮邊保持稍實。

---

## 3. 架構

核心:**一個 `position: fixed` 全螢幕 R3F `<Canvas>`**,只掛在首頁、位於所有內容後方(背景層),一顆球用捲動驅動走完全程。

### 元件

| 元件 | 職責 | 狀態 |
|------|------|------|
| `components/three/JourneyBall.tsx` | fixed canvas 容器 + 球。持有 **noise 實心 mesh** 與 **粒子球(THREE.Points)**,用 `morph` 進度在接近 footer 時從 mesh 融成粒子。內含 scroll 控制器。 | 新增 |
| `components/three/JourneyBallMesh.tsx` | noise 實心球(沿用 `NoiseBlob` shader,加 `uOpacity`);接受每幀傳入的 position/scale/opacity/mouse。 | 新增(可從 NoiseBlob 抽出) |
| `components/three/JourneyBallParticles.tsx` | 粒子球:一組 `THREE.Points`,點分佈在球面/球內,發光藍;`morph` 控制 mesh↔particles 顯隱與粒子擴散。 | 新增 |
| `lib/scrollJourney.ts` | 純函式:給定各區塊 DOM rect + 捲動位置,算出球的目標 `{ x, y, scale, opacity, morph }`(螢幕/像素座標)。可單元測試。 | 新增 |

### 相機
- 用**像素單位的正交相機**(`OrthographicCamera`,world unit = CSS px),讓 DOM 座標 ↔ 3D 座標 1:1。
- 好處:「坐在 About 的垂直中間」「騎在 SVG 軌跡的螢幕 (x,y)」都能直接用 `getBoundingClientRect` 的像素值定位球,不需 unproject 換算。

### Scroll 控制器
- 讀 DOM 錨點:Hero section、ProfileSection、UnifiedTrajectory 的軌跡 layer + path、DanceTeaser/Footer。
- 每幀(或 ScrollTrigger onUpdate)呼叫 `lib/scrollJourney.ts` 算目標,lerp 平滑後套用到球。
- 專案段:用 `path.getPointAtLength(len*p)` 取軌跡點(0..1),乘上 layer rect 換成螢幕像素 → 球的目標位置。

---

## 4. 整合要點

### 4.1 移出 Hero
- `HeroSection.tsx` **不再渲染** `NoiseBlobScene`;保留 hero 文字、`hero-stage` 光暈、`ParticleCursor`、`WebcamToggle`、藍色 halo、捲動視差。
- 球改由首頁層級的 `JourneyBall`(fixed)負責。

### 4.2 UnifiedTrajectory
- **保留**藍色 SVG 軌跡線。
- **移除**它自己的 20px DOM 小球(由 JourneyBall 的 3D 小球取代)。
- 對外提供軌跡 path 與 layer rect(或讓 JourneyBall 直接查詢 DOM),供控制器取螢幕座標。

### 4.3 分層 / 透明(最需細調)
- fixed canvas 位於內容後方(zIndex 0 / 內容 zIndex 1)。
- 內容區背景要能透到球:ProfileSection/ProjectsSection 已是透明背景;`UnifiedTrajectory` 的 `var(--color-background)` wrapper 底改為透明或半透明,讓 fixed 球透出。
- **可讀性**:文字沿用現有 text-shadow;必要區塊加**淡 scrim**(半透明背景色)確保對比。
- Marquee / DanceTeaser / Footer 背景同樣需讓球透出(或球在這些區塊降透明度以保可讀)。

### 4.4 Webcam 互動
- 手部追蹤互動只作用於 **Hero 段**的大球(縮小/入軌後停用),避免干擾旅程。

---

## 5. 粒子球(footer 結尾)

- 粒子球 = 一組 `THREE.Points`,點初始分佈在球面/球內,材質為發光藍(additive blending、圓形貼圖或 point sprite)。
- `morph`(0→1,接近 footer 時推進):mesh 透明度降、粒子透明度升;粒子可從球心略微向外鬆散、輕微自轉,呈「溶解成粒子球」感。
- 停在 footer 後維持**輕微自轉/浮動**(非重組爆散)。
- `lowPower`:大幅降低粒子數。

---

## 6. 效能 / a11y / 降級

- **效能**:全頁只有一顆 mesh + 一組粒子;fixed canvas 只在**首頁旅程區塊在視窗內**時 `frameloop='always'`,其餘 `never`。動畫只用 transform/opacity/shader uniform。
- **lowPower(手機/coarse pointer)**:降 dpr、降粒子數、關手部互動、簡化 shader。
- **a11y**:`prefers-reduced-motion` → 不做捲動旅程,球靜止在 Hero(或極簡);粒子自轉關閉。
- **降級**:WebGL 不支援 → 不掛 fixed canvas,頁面照常(內容不依賴球)。

---

## 7. 範圍 / 檔案 / 分階段

### 會改 / 新增
- 新增:`components/three/JourneyBall.tsx`、`JourneyBallMesh.tsx`、`JourneyBallParticles.tsx`、`lib/scrollJourney.ts`(+ 測試)。
- 改:`HeroSection.tsx`(移除球)、首頁 `app/(frontend)/[locale]/page.tsx`(掛 fixed JourneyBall + 分層)、`components/ui/UnifiedTrajectory.tsx`(移除 DOM 球、保留線、提供 path)、`NoiseBlob.tsx`(加 `uOpacity`,或抽出共用 shader)、必要區塊背景/scrim 微調。

### 不動
- 內容文案、i18n、路由、Payload、其他路由頁。

### 分階段(計畫依此排序,讓中間狀態可跑)
- **Phase 1**:持久 fixed 球 + 純數學控制器 + Hero→About→Projects 三段(半透明、騎軌跡、移除舊 DOM 球)。此階段本身即為可交付、可驗收的完整體驗。
- **Phase 2**:延伸到 Marquee/Dance/Footer + `morph` 溶解成粒子球結尾。

---

## 8. 驗收標準

1. 首頁載入:一顆半透明藍球在 Hero,內容從球後透出;保留滑鼠互動。
2. 往下捲:同一顆球平滑漂移到 ProfileSection 中間並開始縮小(非淡出重生)。
3. 專案區:球為小球,精準騎在現有藍色曲線軌跡上下行;舊 DOM 小球已移除;軌跡線仍在。
4. 繼續捲過 Marquee/Dance,接近 footer 時球**溶解成發光藍粒子球**,停在 footer 輕微自轉/浮動。
5. 全程為**同一顆**連續元素,縮放/位移/透明/morph 平滑無跳變。
6. 內容文字在球上仍清晰可讀(scrim/text-shadow 生效)。
7. `prefers-reduced-motion` 下不做旅程、球靜止;手機檔位不卡頓(降粒子/dpr)。
8. WebGL 不支援時頁面照常、不崩潰。
