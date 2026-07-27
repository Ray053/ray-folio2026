# Fur Humanoid Hero — 設計 Spec

日期:2026-07-27
狀態:設計定案,待寫實作計畫

---

## 1. 目標

把首頁 Hero 的視覺主體從現有的**金屬 noise 球(NoiseBlob)** 換成一隻**毛茸茸的人形毛怪**,並用 **MediaPipe PoseLandmarker(全身 33 關鍵點)即時鏡像使用者的身體動作**。

參考:使用者提供的手機錄影(`media/ScreenRecording_07-27-2026 19-16-14_1.MP4`)——黑底 stage 上一隻 shell-fur 質感的毛絨角色。我們取其**毛髮質感**,但把互動改成**即時 webcam 身體鏡像**(參考影片本身是預錄動畫、沒有用相機)。

### 明確不做(YAGNI)
- 不做影片裡的多種 fur preset(Rainbow / Long & Floppy…),先做**單一招牌毛色**。
- 不做預錄動作動畫(Walk/Run/Dance 按鈕)。
- 不做骨架(rig)+ 骨骼 retarget 的光滑人偶;採用**膠囊骨段直接擺放**。
- 不保留 blob 專屬玩法(捏合分裂、握拳凍結、splinter 碎片、blob trail)。

---

## 2. 行為規格(雙狀態)

### 狀態 A — 待機(預設,未開相機)
- 毛怪站在 stage 上,做輕微的**呼吸 / 擺動**(一組預設站姿 pose + 低頻 noise 位移)。
- 頁面一載入就有生命感,**不主動要求相機權限**(隱私友善)。
- `prefers-reduced-motion` 時:靜止站姿,關閉待機擺動與 fur sway。

### 狀態 B — 即時鏡像(使用者按 WebcamToggle 開啟相機後)
- MediaPipe PoseLandmarker 抓取全身 33 個 world landmarks。
- 毛怪即時模仿使用者的四肢、軀幹、頭部動作。
- **鏡像視角**:x 軸翻轉,使用者舉右手 → 毛怪舉右手(照鏡子感)。
- 關掉 toggle → `stopPose()`,回到狀態 A 待機。

---

## 3. 架構(元件切分)

| 元件 | 職責 | 狀態 |
|------|------|------|
| `lib/poseTracking.ts` | singleton;從 HandLandmarker **改寫成 PoseLandmarker**,每幀吐出 33 個 landmarks(image + world) | 改寫 |
| `components/three/FurMaterial.ts` | shell fur 材質工廠:多層外殼 + 噪聲 alpha,參數化(毛長/層數/密度/根色/尖色/重力/sway) | 新增 |
| `components/three/FurHumanoid.tsx` | 讀 landmarks → 每幀把骨段膠囊 + 關節球擺到對應位置,套 FurMaterial;含待機動畫與平滑 | 新增 |
| `components/three/FurHumanoidScene.tsx` | Canvas + 燈光 + stage;管理待機/鏡像狀態、lowPower/inView 降階 | 新增(Hero 改用它取代 NoiseBlobScene) |
| `components/sections/HeroSection.tsx` | 把 `NoiseBlobScene` 換成 `FurHumanoidScene`;沿用 WebcamToggle / ParticleCursor / 捲動視差 | 改動 |

### 保留不動
- `WebcamToggle`(右下角開關,aria-label + 鍵盤可操作)。
- `HeroSection` 的 GSAP 捲動視差、`IntersectionObserver`(inView)、`lowPower` 偵測。
- `ParticleCursor`(非 lowPower 時)。

### 保留檔案但 Hero 不再引用
- `NoiseBlob.tsx` / `NoiseBlobScene.tsx` / `SplinterSystem.tsx` / `BlobTrail.tsx` / `lib/handGestures.ts`
- 先不刪除,只是 Hero 不再 import(避免破壞其他潛在引用;若確認無他處使用,可在實作計畫中一併清理)。

---

## 4. Fur Shader — Shell 法

瀏覽器渲染毛髮最實用的技術:**同一表面複製成多層外殼**,每層沿法線外推,用噪聲決定每根毛在哪一層「斷掉」。

```
表面 → 殼0(貼皮膚)→ 殼1 → 殼2 → … → 殼N(毛尖)
每層外推:position += normal * shellStep * layerIndex
每層 alpha:step(noise(uv), 1 - layer/N)   // 越外層門檻越高,只有噪聲高處長到毛尖
```

### 實作要點
- `THREE.ShaderMaterial`,每根骨段 mesh 渲染 **N 層**(迴圈重繪或 instancing)。
- **Vertex**:`position += normal * shellStep * layerIndex`,並加一個隨層數遞增的位移向量(重力向下 + 待機 sway noise)→ 毛自然垂墜/飄動。
- **Fragment**:一張 tileable value-noise 決定毛分布;`alpha = noiseVal > (layer/N) ? … : 0`。
- **著色**:`color = mix(rootColor, tipColor, layer/N)`(根暗尖亮,fake AO);邊緣 rim light 增加絨毛輪廓感。
- **可調參數**(FurMaterial.ts):`furLength`、`shells`、`density`、`rootColor`、`tipColor`、`gravity`、`sway`。

### 顏色(沿用設計系統:金屬冷灰藍)
- 根色 `#122333`(blue-700)→ 尖色 `#8AAABF`(accent-dark)/ highlight `#A0C4D8`。
- Light / Dark mode 各一組根/尖色(透過 CSS custom property 或傳入 prop)。
- **單一招牌毛色**,不做多 preset。

---

## 5. 身體 landmark → 骨段對應

用 MediaPipe PoseLandmarker 的 33 點,取需要的,連成**骨段(capsule)**,關節處放**球(joint ball)**填縫。

| 骨段 | 由哪兩個 landmark 連成 | 幾何 |
|------|----------------------|------|
| 上臂 ×2 | shoulder(11/12) → elbow(13/14) | 膠囊 |
| 前臂 ×2 | elbow(13/14) → wrist(15/16) | 膠囊 |
| 大腿 ×2 | hip(23/24) → knee(25/26) | 膠囊 |
| 小腿 ×2 | knee(25/26) → ankle(27/28) | 膠囊 |
| 軀幹 | shoulder 中點 → hip 中點 | 較粗膠囊 |
| 頭 | nose(0) + 雙耳(7/8) 估一顆球 | 球 |
| 關節球 | 每個上述端點 landmark | 小球,填接縫 |

### 每幀更新
讀 `worldLandmarks`(公制 3D,轉身有深度),對每根膠囊:
1. **位置** = 兩端 landmark 中點。
2. **朝向** = 用 `quaternion` 把膠囊預設軸對齊(end - start)方向。
3. **長度** = scale 成兩端距離。

→ 不需骨架 / IK,直接「擺放」,穩定可靠。**fur 殼往外長會把相鄰部件輪廓融成一坨毛絨團**,關節接縫被毛蓋住。

### 平滑(避免抽搐)
- 每個 landmark 座標存上一幀,`lerp(prev, cur, α)`(α≈0.4,可調);必要時用 one-euro filter。
- **z 軸(深度)較吵**,平滑係數可比 x/y 更保守。

### 信心值處理
- 某 landmark `visibility` 太低 → 凍結該骨段在上一個有效位置,不亂飛。

---

## 6. 效能與降階

Shell fur 成本 ≈ 層數 × 骨段數 × dpr。沿用現有 `lowPower`(手機 / coarse pointer)分兩檔:

| 參數 | 桌機 | 手機 / lowPower |
|------|------|----------------|
| fur 層數(shells) | 16 | 6 |
| dpr | [1, 2] | 1 |
| antialias | on | off |
| PoseLandmarker delegate | GPU | GPU(失敗退 CPU) |
| 追蹤解析度 | 640×480 | 480×360 |

- 沿用 `IntersectionObserver`:Hero 捲出畫面 → `frameloop='never'` 停 R3F,**同時暫停 pose 偵測**(省電 + 釋放相機處理)。
- Pose 偵測沿用現有 rAF loop,`detectForVideo` 每幀一次;landmark 平滑在 CPU 很輕。
- 膠囊 8~12 段、關節球低多邊形;視覺重量全在 fur 殼。

---

## 7. 隱私

- **預設不開相機**;毛怪先做待機動畫。使用者主動按 `WebcamToggle` 才 `getUserMedia`。
- 相機影像**只在本地**餵給 MediaPipe,不上傳、不錄製、不掛可見 video 元素(維持現狀)。
- 關閉 toggle → `stopPose()` 停 stream、關 landmarker,回待機。

---

## 8. 降級 / 錯誤處理

| 情境 | 行為 |
|------|------|
| `prefers-reduced-motion` | 靜止站姿,關待機擺動與 fur sway;鏡像仍可手動開(使用者主動互動) |
| WebGL 不支援 / context 建立失敗 | 顯示靜態毛怪剪影或漸層背景;Hero 文字照常 |
| `getUserMedia` 被拒 / 無相機 | 維持待機動畫;toggle 顯示提示,不崩潰 |
| MediaPipe WASM / model 載入失敗 | 待機動畫照跑;鏡像功能靜默停用 |
| 某 landmark 信心不足 | 凍結該骨段於上一有效位置 |

---

## 9. 驗收標準

1. Hero 載入即顯示毛茸茸人形做待機呼吸/擺動(未要求相機權限)。
2. 按 WebcamToggle 開相機後,毛怪在合理延遲內即時鏡像使用者四肢/軀幹/頭。
3. 舉右手 → 毛怪舉右手(鏡像正確)。
4. 毛髮呈 shell fur 質感,冷灰藍配色,Light/Dark 皆正常。
5. 關節接縫被毛覆蓋,整體讀起來是一隻連貫的毛絨生物,無明顯散開棍子感。
6. 手機檔位不卡頓(降階生效);捲出畫面停止渲染與偵測。
7. `prefers-reduced-motion`、無相機、WebGL 失敗等情境皆優雅降級,不崩潰。
