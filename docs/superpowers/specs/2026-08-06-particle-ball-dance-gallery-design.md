# Particle Ball + 3D Dance Circle-Gallery — 設計 Spec

日期:2026-08-06
狀態:設計定案,待寫實作計畫(分 2a / 2b,先 2a)
依賴:接在 scroll journey ball(Phase 1,`feature/y2k-acid-bauhaus` 分支上)與 Y2K/Acid/Bauhaus 風格之上。

---

## 1. 目標

1. 讓 journey ball 走完全程:捲到首頁下半(Dance/Footer 區)時**溶解成發光粒子球(particle ball)**。這是先前延後的 scroll-journey Phase 2。
2. 用一個 **pinned 3D 圓柱藝廊**取代舞蹈內容:舞蹈影片排成 3D 圓柱**繞著中心的 particle ball 公轉**,捲動驅動旋轉,部分平面轉到球後被真實遮擋。
3. **移除 `/dance` 分頁**與首頁 `DanceTeaser`;舞蹈內容改由這個藝廊呈現。

### 明確不做(YAGNI)
- 不做多顆球/多個粒子系統。
- 不同時播放所有影片(只播正前方一支)。
- 不保留 `/dance` route 或 Instagram 式 bento。
- 不改 i18n schema(沿用 DanceVideos)。

---

## 2. 行為

### 首頁結構(改動後)
```
Hero → (UnifiedTrajectory: Profile + Projects) → Marquee → Dance 圓形藝廊(pinned) → Footer
```
- 移除首頁 `DanceTeaser`;移除 `/dance` route。

### 旅程收尾(Phase 2a)
- 捲過 Projects/Marquee,journey ball 繼續下行;進入 Dance 區時 **morph:noise 實心 mesh → 發光粒子球**(藍/lime 粒子)。
- particle ball 停在 Dance 區中心,輕微自轉/浮動;pin 結束後到 Footer 收尾(停駐或淡出)。

### 圓形藝廊(Phase 2b)
- Dance 區 **pin 住(sticky)** 一段捲動距離。
- pin 期間:particle ball 在正中心;N 個舞蹈影片平面排成 **3D 圓柱**繞球公轉;**捲動 → 圓柱 Y 軸旋轉**。
- **真實深度**:平面與球共用 z-buffer,轉到球後的平面被遮住。
- 轉到**正前方**的平面:**放大 + 播放影片 + 顯示標題/年份**;其餘縮小、暫停、顯示縮圖。
- pin 釋放後繼續往下到 Footer。

---

## 3. 架構(全部在現有 fixed R3F journey canvas 內)

| 元素 | 做法 |
|------|------|
| Particle ball | noise mesh 與 `THREE.Points` 粒子球並存;`morph` uniform/進度在進 Dance 區時把 mesh 透明度降、粒子升,呈溶解。粒子分佈球面/球內,additive、藍→lime。 |
| 3D 圓柱藝廊 | N 個 `THREE.Mesh` 平面(舞蹈項目)排在半徑 R 的圓柱上,parent 成一個 group;ScrollTrigger scrub(pin 進度)→ group.rotation.y。 |
| 影片貼圖 | 正前方那張 `VideoTexture` 播放;其餘 `Texture`(縮圖)、暫停。控制器判定「正前方索引」並切換播放。 |
| 深度遮擋 | 平面與球同場景、depthTest 開,轉到後方自然被球遮。 |
| Pin 協調 | 一個 pinned DOM 區塊(sticky/GSAP pin)提供捲動長度 + 標題 UI;fixed canvas 渲染 3D;scroll 控制器把 pin 進度 → 旋轉角 + 正前方索引。 |
| 資料 | 沿用 `DanceVideos`(Payload)/ placeholder:`{ title, year, videoSrc?, thumbnailSrc? }`。 |

- particle ball / 藝廊只在 Dance 區在視窗內時渲染(沿用 journey 的 inView/frameloop 機制)。
- 相機:沿用 journey 的透視相機;Dance 區把球與圓柱置中框好。

---

## 4. 移除

- `app/(frontend)/[locale]/dance/`(route)、`components/sections/DancePage.tsx`、`components/sections/DanceTeaser.tsx`。
- 指向 `/dance` 的連結(若有)。
- `components/ui/DanceVideoCard.tsx`(若無他處使用)。
- 保留:`DanceVideos` 資料來源(Payload)+ 型別,餵藝廊。

---

## 5. 效能 / a11y / 降級

- **效能**:只播**正前方一支**影片(VideoTexture),其餘暫停縮圖;`lowPower`(手機)→ 降粒子數、全部只用縮圖(前方才播)、降 dpr。
- **a11y**:`prefers-reduced-motion` → 不自動旋轉/不自轉;Dance 區退化成**靜態格狀/堆疊**列出舞蹈影片(可點播),球靜止。
- **降級**:WebGL 不支援 → 不掛 canvas,Dance 區退化成 DOM 影片格狀;頁面照常。
- 動畫只用 transform/opacity/shader uniform / R3F 場景旋轉。

---

## 6. 範圍 / 分階段

### Phase 2a — Particle ball(球溶粒子,完成旅程)
- 在 journey canvas 內加**粒子球**與 `morph` 進度;journey 到 Dance/Footer 區時 mesh → 粒子。
- 尚無藝廊;particle ball 停在 Dance 區中心自轉,Footer 收尾。
- 本身可交付、可驗收(球走完全程並溶成粒子)。

### Phase 2b — 3D Dance 圓形藝廊 + 移除 /dance
- 加**繞球的 3D 影片圓柱**、pin 區塊、scroll 旋轉、正前方播放、深度遮擋。
- 移除 `/dance` route、`DancePage`、`DanceTeaser`,首頁改放 pinned 藝廊區塊。
- 降級/reduced-motion 靜態格狀。

> 兩階段各自成計畫,先 2a。這是目前最複雜的 R3F 功能(繞球影片平面 + 粒子 morph + pin + 深度),風險最高。

---

## 7. 驗收標準

### Phase 2a
1. 捲過 Projects/Marquee 後,同一顆 journey ball 繼續下行,進入 Dance 區時**平滑溶解成發光粒子球**(非淡出重生)。
2. particle ball 停在 Dance 區中心輕微自轉;Footer 前收尾。
3. 粒子為藍/lime 發光,`lowPower` 降粒子數不卡頓;`prefers-reduced-motion` 下球靜止不自轉。
4. WebGL/降級情境不崩潰。

### Phase 2b
5. Dance 區 pin 住;舞蹈影片排成 3D 圓柱繞 particle ball 公轉,捲動驅動旋轉。
6. 部分平面轉到球後被**真實遮擋**。
7. 正前方平面放大 + **播放影片** + 顯示標題/年份;其餘縮圖暫停。
8. `/dance` route、`DancePage`、`DanceTeaser` 已移除;無死連結。
9. `prefers-reduced-motion` / WebGL 失敗 → Dance 區退化成靜態影片格狀,可點播,不崩潰。
