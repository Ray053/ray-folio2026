# visionOS Glass + Pure-Blue Hero — 設計 Spec

日期:2026-08-04
狀態:設計定案,待寫實作計畫

---

## 1. 目標

把作品集網站改成 **Apple visionOS 風的液態玻璃(liquid glass)語言**:

- Hero 保留現有的 **R3F noise ball**,但把金屬藍灰重新調成**純藍發光球**(#0A84FF 系)。
- 全站 accent 從藍灰(#5C82A0)換成**單一純藍 #0A84FF**,一個藍鎖死全站。
- **浮動 chrome**(Navbar、語言/深淺/webcam toggle、Hero 資訊島)套上 visionOS 玻璃質感。
- 保留現有 **light + dark 雙主題**,每個玻璃/顏色都給兩組值。

### Design Read(taste skill `design-taste-frontend`)
> 設計師作品集,Apple-adjacent premium 語言,深/淺雙主題,以純藍發光 noise ball 為核心、浮動玻璃 chrome 疊在前景。
> **Dials:** VARIANCE 7 · MOTION 6 · DENSITY 3。

### 誠實前提
Apple「Liquid Glass」沒有官方網頁實作,本 spec 做的是 **`backdrop-filter` + 分層邊框 + 高光的近似**,程式碼註解需標明為 approximation。

### 明確不做(YAGNI)
- 不加 `@react-three/postprocessing`(真 Bloom);球發光用 CSS 光暈 + shader Fresnel。
- 玻璃**只**套浮動 chrome,不擴散到內容區(專案卡/Dance/About/Footer 版面不變)。
- 不碰 i18n、路由、Payload、noise-blob 既有效能優化。
- 不做多主題色;只有一個藍。

---

## 2. 色彩系統(純藍鎖色,light + dark)

改 `app/globals.css` 的 CSS 變數。以 **#0A84FF** 為基準,一個藍鎖死全站(taste skill color-consistency-lock)。

### 2.1 語意 token

| Token | Light | Dark |
|-------|-------|------|
| `--color-accent` | `#0A84FF` | `#0A84FF` |
| `--color-accent-hover` | `#0060DF` | `#409CFF` |
| `--color-link` | `#0A84FF` | `#0A84FF` |
| `--color-link-hover` | `#0060DF` | `#409CFF` |
| `--color-shadow-accent` | `rgba(10,132,255,0.28)` | `rgba(10,132,255,0.40)` |

- Light:hover 壓深到 `#0060DF`,確保連結文字在白底過 WCAG AA(4.5:1)。
- Dark:hover 提亮到 `#409CFF`,在近黑底上夠亮。
- 中性色(gray scale、background、surface、text)**維持現值不動**。

### 2.2 藍色 scale(供玻璃/光暈/shader 取用)
在 `:root` 補一組純藍 scale(取代或並存於現有 blue-* 藍灰,實作時以新藍為準):
```
blue-50:  #EAF4FF   (高光 / 毛尖等最亮)
blue-300: #5AB0FF
blue-400: #0A84FF   ← primary accent
blue-500: #0060DF   ← hover (light)
blue-700: #001B3D   ← 最深 / 球體陰影
```

### 2.3 Noise ball 漸層
去掉灰中間調,改純藍發光梯度(由暗到亮):
```
#001B3D → #0A84FF → #5AB0FF → 高光 #EAF4FF
```

---

## 3. 玻璃系統(只給浮動 chrome)

### 3.1 `.glass` 配方(soft-skill Double-Bezel + taste skill §5)

在 `globals.css` 定義可重用的玻璃 utility(class 或 CSS 變數組),light/dark 各一組:

```
共同:
  backdrop-filter: blur(20px) saturate(1.4);
  border-radius: 1.5rem;                 (squircle;圓鈕用 9999px)
  border: 1px solid <border>;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.15),  ← 上緣鏡面高光
    0 8px 32px <藍色調染色陰影>;            ← 非純黑,染 accent

Dark:  background: rgba(255,255,255,0.08);  border: rgba(255,255,255,0.12);
Light: background: rgba(255,255,255,0.60);  border: rgba(255,255,255,0.70);
```

### 3.2 套用元件

| 元件 | 改法 |
|------|------|
| `components/layout/Navbar.tsx` | 改 **fluid island**:脫離頂部的浮動玻璃藥丸(`margin-top` 一小段、置中、`width: max-content`、`border-radius: 9999px`),不再貼邊。導覽列在桌機單行(taste skill nav 規則)。 |
| `LangToggle` / `ThemeToggle` / `WebcamToggle` | 玻璃圓鈕(`.glass` + `rounded-full`);有 icon 者用 button-in-button(icon 在自己的小圓圈)。 |
| Hero 玻璃資訊島 | 見 §5;`.glass` 面板裝 eyebrow + tagline + Download CV CTA。 |

### 3.3 無障礙 fallback(taste skill 明列)
- `@media (prefers-reduced-transparency: reduce)`:所有 `.glass` 退成**實心**背景(用 `--color-surface`),移除 blur。
- 玻璃鈕/CTA 壓在藍球上時,加**描邊或半透明 scrim**,確保文字對比過 WCAG AA(body 4.5:1、大字 3:1)。
- 保留現有 toggle 的鍵盤操作與 `aria-label`。

---

## 4. Noise ball 發光

**技術:CSS 光暈層 + shader Fresnel 內發光(不加 postprocessing)。**

### 4.1 CSS 光暈
- Canvas 後方墊一層藍色 `radial-gradient` halo(`--color-shadow-accent` 系),dark 較強、light 很淡。
- `pointer-events: none`,不影響互動。

### 4.2 Shader 內發光(改 `components/three/NoiseBlob.tsx` fragment)
- 顏色常數換成 §2.3 純藍漸層。
- 加 **Fresnel 邊緣光**:視線與法線夾角越大(邊緣),越往高光 `#5AB0FF → #EAF4FF` 提亮 → 球體輪廓發亮。
- 輕微整體 emissive lift,讓球在深底上「亮」。

### 4.3 效能
- 沿用現有 `lowPower`(手機/coarse pointer):手機關掉或大幅減弱 CSS 光暈、Fresnel 可降強度。
- 沿用現有 `inView` frameloop 暫停、dpr/antialias 分檔。

---

## 5. Hero 構圖(visionOS + taste skill anti-center §4.3)

- **藍球**:置中偏後,當發光核心(維持現有滑鼠互動與捲動視差)。
- **「Ray」大標**:**不裝進玻璃**,大字直接浮在球前(讀起來像漂浮在空間中)。
- **玻璃資訊島**:偏一側浮動的 `.glass` 面板,裝:
  1. eyebrow(小寫寬字距 role 標籤)
  2. tagline(≤20 字)
  3. **Download CV** CTA(button-in-button 藥丸)
- Hero 文字堆疊守 taste skill 上限:eyebrow + 標題 + tagline + 1 CTA(≤4 元素)。
- Navbar 浮動玻璃島在最上;右下角 toggle 群玻璃化。
- Hero 高度沿用 `100dvh`;`prefers-reduced-motion` 降級(現有)。

---

## 6. 範圍

### 會改的檔案
- `app/globals.css` — 純藍 token(light+dark)、`.glass` utility、Hero 藍光暈、reduced-transparency fallback。
- `components/three/NoiseBlob.tsx` — shader 顏色改純藍 + Fresnel 發光。
- `components/layout/Navbar.tsx` — 改浮動玻璃島。
- `components/layout/LangToggle.tsx` / `ThemeToggle.tsx` / `components/ui/WebcamToggle.tsx` — 玻璃圓鈕。
- `components/sections/HeroSection.tsx` — 光暈層 + 玻璃資訊島。

### 不動的東西
- 專案卡、Dance 卡、About、Footer、WorkPage、ProjectDetail 的**版面結構全部不動**;只透過 token 自動換上新藍 accent(連結/強調色變藍),不改佈局。
- i18n、路由、Payload、noise-blob 效能優化。
- 玻璃不擴散到內容區。

---

## 7. 約束(全域)

- **一個藍鎖死全站**:accent 只用 #0A84FF 系,任何 section 不得出現其他 accent 色。
- **玻璃只在浮動 chrome**:`backdrop-filter` 不得出現在任何會滾動的內容區(效能)。
- **雙主題**:每個玻璃/顏色都必須給 light + dark 兩組值,主題鎖(section 不反轉)。
- **形狀鎖**:玻璃面板統一 squircle 圓角(`1.5rem`),互動圓鈕統一 pill(`9999px`)。
- **發光不加套件**:CSS 光暈 + shader Fresnel,不引入 postprocessing。
- **a11y**:`prefers-reduced-transparency` 實心 fallback、`prefers-reduced-motion` 降級、玻璃上文字過 AA、鍵盤/aria 保留。
- **動畫只用 `transform`/`opacity`**;blur 只在 fixed/浮動元素。

---

## 8. 驗收標準

1. 全站 accent(連結、強調、CTA、球、光暈)皆為純藍 #0A84FF 系,light/dark 皆過對比,無其他 accent 色殘留。
2. noise ball 呈**純藍發光**(去藍灰),邊緣有 Fresnel 亮邊,dark 模式球周圍有藍色 halo。
3. Navbar 為脫離頂部的**浮動玻璃島**,桌機單行;三個 toggle 為玻璃圓鈕;Hero 有一塊玻璃資訊島含 Download CV。
4. 玻璃在 light + dark 皆有正確的邊框高光與染色陰影,不是死板的 `backdrop-blur` 一片。
5. 內容區(專案/Dance/About/Footer)**版面未變**,僅 accent 顏色更新。
6. `prefers-reduced-transparency` 下玻璃退成實心、無 blur;`prefers-reduced-motion` 下動畫降級;手機檔位球發光減弱、不卡頓。
7. 玻璃 chrome 上的所有文字/圖示對比過 WCAG AA。
