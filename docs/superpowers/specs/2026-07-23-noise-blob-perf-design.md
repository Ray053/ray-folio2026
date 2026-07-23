# Noise Blob 效能優化 — Design

**日期:** 2026-07-23
**目標:** 讓 Hero 的 noise blob 在每一台裝置上都能流暢跑,包含低階手機。

---

## 問題

目前 `NoiseBlob` 的 shader 計算量很重,弱裝置卡頓:

- **Vertex shader**:每個頂點除了算 noise 位移,還用 6 次數值梯度取樣重算法線 → 每頂點約 21 次 simplex noise。detail 5 ≈ 1 萬頂點。
- **Fragment shader**:逐像素 3 顆環繞光、`pow(x, 300)` 超高次方 specular、5+ 次 cosine 漸層。
- 現有 `lowPower` 只降 detail(3)、DPR(1)、關 antialias,但 fragment shader 沒變輕,且 DPR=1 在高密度手機上會糊/鋸齒。

## 設計原則(使用者確認)

1. **保清晰,不砍解析度。** 降 DPR 會讓邊緣鋸齒/像素感重 → 不接受。改用真實 devicePixelRatio 設上限(≤2)。
2. **靠砍 shader 計算量拿回效能,而非砍畫質解析度。** 弱機的球一樣滿解析度、邊緣平滑,只是光影/漸層細節略減。
3. **實測 FPS 自動降級。** 不靠螢幕寬度猜,開場跑幾秒量測 FPS,掉幀就自動降一階,避免誤判。

## 畫質分級(quality tiers)

用一個 `quality` 值(`high` | `mid` | `low`)驅動 shader 與幾何:

| 參數 | high(桌機) | mid | low(弱機) |
|---|---|---|---|
| icosahedron detail | 5 | 4 | 3 |
| noise 層數(vertex) | 3 | 2 | 2 |
| 法線重算 | 6-tap 數值梯度 | 3-tap 便宜梯度 | 3-tap 便宜梯度 |
| fragment 光源數 | 3 顆 | 2 顆 | 1 顆 |
| 高次方 specular `pow(x,300)` | 保留 | 降階(≤120) | 拿掉,只留單一柔和高光 |
| cosine 漸層評估次數 | 完整(albedo/sheen/rim) | 精簡 | 最精簡(共用) |
| DPR 上限 | min(devicePixelRatio, 2) | min(devicePixelRatio, 2) | min(devicePixelRatio, 1.75) |
| antialias | on | on | off(靠足夠 DPR 保邊緣) |

實作上 shader 用 `#define` / uniform 分支或多版本編譯,避免執行期 if 拖慢。傾向用編譯期常數(把 quality 當 prop → 產生不同 shader 字串),因為 GPU 動態分支對舊機不友善。

## FPS 自動降級機制

- 進場先以偵測到的初始 tier 啟動(桌機 `high`、`pointer: coarse` / 窄螢幕先給 `mid`)。
- 掛一個 FPS 量測器(rolling average over ~90 frames):
  - 平均 < ~45fps 持續一段時間 → 降一階(high→mid→low)。
  - 只降不升(避免震盪),降到 low 為底。
- tier 變動時重建 material(shader 重編),幾何 detail 變更也重建。頻率極低,可接受。

## 影響範圍

- `components/three/NoiseBlob.tsx` — shader 依 quality 產生;法線梯度改便宜版;光源/specular 分級。
- `components/three/NoiseBlobScene.tsx` — 接收 `quality`,傳給 blob;DPR 依 tier;antialias 依 tier。
- `components/sections/HeroSection.tsx` — 初始 tier 偵測 + FPS 量測器 + 降級 state。
- 可能新增 `lib/useAdaptiveQuality.ts`(或類似)封裝 FPS 量測與 tier 狀態,讓 HeroSection 保持乾淨。

## 不做(YAGNI)

- 不做「弱機改靜態圖」的 fallback(使用者選擇保留互動球)。
- 不做畫質往上升的邏輯(只降不升)。
- 不改 particle cursor / splinter / webcam 相關邏輯(本次聚焦球本身)。

## 驗收

- 桌機視覺與現在幾乎一致。
- 低階手機(或以 `low` tier 模擬)流暢、邊緣不鋸齒、無明顯掉幀。
- `prefers-reduced-motion` 仍降級(既有行為不破壞)。
