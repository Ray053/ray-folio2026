# Y2K × Acid × Bauhaus Redesign — 設計 Spec

日期:2026-08-06
狀態:設計定案,待寫實作計畫(分階段)
取代:本 spec **取代 visionOS liquid-glass 方向**(`2026-08-04-visionos-glass-hero-design.md`)。玻璃全面移除。
保留:scroll journey ball 的行為(Phase 1)保留,只改配色與造型融入新風格。

---

## 1. 目標

把作品集從 Apple visionOS 玻璃風,整體改造成 **Y2K × Acid Design × Bauhaus** 融合風格:白底大宮、幾何硬邊、多層電光藍堆疊、酸綠炸點。

### Design Read
> 設計師作品集,**Bauhaus 幾何結構 + Acid 高飽和 + Y2K 數位感**;亮白底,電光藍 #0033FF 為主、多層藍堆疊,酸橘綠 #CCFF00 單一衝突跳色。硬邊、扁平、硬位移陰影,大膽而有能量。

### 明確不做(YAGNI)
- 不做 dark mode(全站單一亮色主題);移除 `ThemeToggle`。
- 不保留任何 frosted glass / backdrop-blur 造型。
- acid 跳色只有 **一個**(lime #CCFF00),不增生其他 acid 色。
- 不改 i18n/路由/Payload schema。

---

## 2. 調色盤(白底 · 多層藍 · 酸綠)

單一亮色主題。全部定義在 `app/globals.css`(移除 `.dark` 區塊)。

```
── 中性 ──
paper     #FFFFFF     背景大宮
paper-2   #F2F4F8     次級淺塊
ink       #0A0A0A     文字 / 粗線 / 邊框(黑)

── 多層藍(堆疊/深淺) ──
blue-deep     #001A80   深藍塊 / 深底
blue-primary  #0033FF   ← 主角(電光藍)accent
blue-mid      #3D6BFF   中藍
blue-light    #8AA5FF   淺藍
blue-pale     #DCE4FF   淡藍塊底
cyan-pop      #00C2FF   Y2K 電子青(層疊點綴)

── acid(唯一跳色) ──
lime      #CCFF00     高衝擊,少量
```

### 語意 token(單一主題)
```
--color-background      #FFFFFF
--color-surface         #F2F4F8
--color-ink             #0A0A0A
--color-accent          #0033FF     (blue-primary)
--color-accent-2        #00C2FF     (cyan-pop,層疊)
--color-acid            #CCFF00
--color-text-primary    #0A0A0A
--color-text-secondary  #3D3D3D
--color-border          #0A0A0A     (粗黑邊為主)
--shadow-hard           6px 6px 0 var(--color-accent)   (硬位移陰影,可換 ink/acid)
```

### 對比 / a11y 規則(白底下)
- **電光藍 #0033FF**:on white ≈ 9:1 → 文字/圖示可用(過 AA)。白字 on #0033FF 亦過 AA。
- **lime #CCFF00**:亮度極高 → **不可當白底上的文字色**;只作**填色塊**,其上文字一律用 **ink 黑**(黑 on lime 過 AA)。lime 也可作邊框/裝飾點。
- **cyan #00C2FF**:同樣偏亮 → 當塊/裝飾,不當白底文字;其上用黑字。
- text-secondary #3D3D3D on white 過 AA。

---

## 3. 字型

- **大標 / Heading**:沿用 `Syne`,但走 Bauhaus——**heavy(700+)、UPPERCASE、緊字距(-0.02em)、超大 scale**。
- **標籤 / eyebrow / 編號 / 狀態**:`Geist Mono`(已有),做 Y2K 數位感:`[01]`、`// SECTION`、`★`、大寫寬字距。
- **內文**:`Inter` 保留。
- 形狀鎖:標題全大寫、mono 標籤全大寫,字距一致。

---

## 4. 造型 / 材質語言(取代玻璃)

### 4.1 硬邊色塊(取代 `.glass`)
定義新的可重用「硬塊」utility(class 或樣式組),全站共用:
```
背景: 實心填色(paper / blue-pale / blue-primary / lime …)
邊框: 2–3px solid var(--color-ink)      ← 粗黑邊
圓角: 0(直角;形狀鎖 = 全硬邊)
陰影: var(--shadow-hard)  例 6px 6px 0 #0033FF   ← 不模糊的硬位移陰影
```
- 變體:`hard-block`(白底黑邊藍影)、`hard-block--blue`(藍底白字)、`hard-block--acid`(lime 底黑字)。

### 4.2 Bauhaus 幾何母題
- 圓 / 方 / 三角 / 半圓 等**純幾何原形**當裝飾與版面骨架。
- **粗分隔線**(2–3px ink)、強**不對稱網格**、大**色塊拼貼**、藍色幾何裝飾。

### 4.3 Y2K 元素
- mono 標籤加括號/星號/斜線;箭頭 `→ ↗`;星爆/閃亮;**marquee**(已有,可強化);編號標籤 `[01]`;少量 chrome/bevel 或掃描線點綴。

### 4.4 Acid 手法
- 高飽和、**粗描邊**、貼紙感、元素**微傾斜(1–3°)**、lime 炸點(hover / 標記 / 單一圖形)。

### 4.5 元件(硬塊化)
| 元件 | 新造型 |
|------|--------|
| Navbar | 粗黑邊 + 硬藍影的**方形/膠囊硬塊**(非玻璃);或頂部整條粗邊 bar。單行。 |
| 按鈕 / toggle | 扁平粗邊硬塊;hover = **壓進陰影**(位移到陰影位置)或**翻成 lime 底黑字**。 |
| LangToggle | 硬塊分段;當前語言 lime 或藍底反白。 |
| 專案卡(ProjectCard/WorkBentoCard) | 硬邊色塊 + 硬位移陰影 + **編號 `[01]`** + 藍/lime 標記;可微傾斜。 |
| Hero 資訊島 | 玻璃島 → **硬邊白塊**(粗黑邊、硬藍影)或直接去框、大字裸放。 |
| ThemeToggle | **移除**(無 dark mode)。 |

---

## 5. Noise 球改色(融入新風格)

- shader accent 從 #0A84FF → **電光藍**:`#001A80 → #0033FF → #8AA5FF`,高光 `#00C2FF`;**Fresnel 邊緣閃 lime `#CCFF00`** 當 acid 點。
- 旅程(Hero→About→專案)行為不變;透明度/縮放沿用 Phase 1。
- 硬邊排版中保留這顆有機藍球 = 刻意的 acid/Y2K 對比。

---

## 6. 移除項

- `.dark` 主題區塊與所有 dark 值;`ThemeToggle` 元件與其在 Navbar 的引用。
- 所有 `.glass` / `.glass-pill` utility 與 `backdrop-filter` 用法。
- visionOS 藍灰/柔藍殘留(改電光藍)。

---

## 7. 範圍 / 分階段

### Phase A — 設計系統地基
- `globals.css`:新 palette token(單一亮色)、移除 `.dark`、移除 `.glass`、新增「硬塊」utility + 硬陰影 + 直角。
- 字型:Syne heavy/uppercase 規則、mono 標籤樣式。
- 浮動 chrome 硬塊化:Navbar、LangToggle、按鈕;移除 ThemeToggle。
- noise 球改電光藍 + lime rim。

### Phase B — 首頁區塊
- Hero、ProfileSection、ProjectsSection(卡片編號/硬塊)、Marquee(強化)、DanceTeaser、Footer 套 Bauhaus/acid 母題與幾何裝飾。

### Phase C(選配)— 其他頁
- about / work / dance / project detail 沿用新 token 與硬塊元件,逐頁微調。

> 計畫將**分階段各自成計畫**(Phase A 先)。每階段本身可交付、可驗收。

---

## 8. 約束(全域)

- **單一亮色主題**;不得出現 dark mode 或 `.dark`。
- **一個 acid 跳色鎖死**:lime #CCFF00,只作填色/裝飾,不作白底文字。
- **一個藍為主**:電光藍 #0033FF 為 accent;其餘藍僅作層疊色塊/深淺,不另立第二 accent 語意。
- **形狀鎖**:全站直角(radius 0);硬位移陰影(不模糊)。
- **無玻璃 / 無 backdrop-blur**。
- **a11y**:lime/cyan 塊上一律黑字;藍塊上白字;文字對比過 WCAG AA;`prefers-reduced-motion` 降級(傾斜/marquee/球旅程靜止)。
- **動畫**只用 transform/opacity/shader uniform。

---

## 9. 驗收標準

1. 全站白底單一亮色主題;無 dark mode、無 ThemeToggle、無任何玻璃/blur。
2. 主色為電光藍 #0033FF,並有多層藍(deep/mid/light/pale/cyan)做色塊層疊;lime #CCFF00 作唯一 acid 跳色、少量高衝擊。
3. 元件為**硬邊色塊 + 粗黑邊 + 硬位移陰影 + 直角**(Bauhaus/brutalist),無圓角玻璃。
4. 出現 Bauhaus 幾何母題(圓/方/三角、粗線、不對稱網格、色塊)與 Y2K 元素(mono 標籤/編號/箭頭/marquee)。
5. noise 球為電光藍 + lime 邊緣,旅程行為不變。
6. 所有 lime/cyan 塊上文字為黑、藍塊上為白,對比過 AA。
7. `prefers-reduced-motion` 下傾斜/marquee/球旅程降級;動畫僅 transform/opacity。
