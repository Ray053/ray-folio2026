// Real project content used whenever the CMS is unreachable (e.g. the
// MongoDB Atlas connection times out) — shared by the /work list, the
// homepage "Selected Work" teaser, and the /work/[slug] detail page so all
// three stay in sync instead of keeping three separate copies.
export type PlaceholderProject = {
  id: string
  slug: string
  title: string
  description: string
  tags: string[]
  year: number
  coverColor: string
  coverSrc?: string
  videoSrc?: string
  liveUrl?: string
  role?: string
  duration?: string
  outcome?: string
  /** Long-form paragraphs rendered on the detail page below the summary. */
  caseStudy?: string[]
}

export const PLACEHOLDER_PROJECTS: PlaceholderProject[] = [
  {
    id: 'group-buy-ops',
    slug: 'group-buy-ops',
    title: '代購營運管理系統',
    description: '把代購事業原本跑在 Google Apps Script 上的後台，重寫成前後台分離的正式系統，並串接 LINE OA 處理會員綁定與到貨通知。',
    tags: ['產品設計', '全端開發', '系統整合'],
    year: 2026,
    coverColor: '#0033FF',
    role: '獨立全端開發者',
    duration: '2026 年 8 月 — 進行中',
    outcome: '完成 8 大後台模組（儀表板、團務、訂單、成本／收款記帳、員工結算、庫存、月報）與獨立客戶前台的正式上線版本；後端補上原本只靠前端隱藏、實際上沒擋住的權限檢查，並用記憶體快取解決 Google Sheets 直接讀寫造成的效能瓶頸。',
    caseStudy: [
      '## 問題',
      '家人的代購事業原本用 Google Apps Script 直接寫在 Google 試算表上維運。訂單量變大之後，浮現兩個問題：頁面回應越來越慢，操作卡頓直接影響出貨效率；權限只在前端「藏功能」，任何人繞過畫面就能直接呼叫到後台操作，沒有真正的存取控管。這不是一個「重新設計介面」的題目，而是要在不打斷真實營運的前提下，重新蓋地基。',
      '## User Research',
      '在動手改版之前，我先盤點了現有流程，訪談實際每天在用系統的老闆與員工，找出三件真正該優先解決的事：',
      [
        '- 每天最高頻的操作是登記新訂單跟回報到貨，任何延遲都直接卡到出貨排程',
        '- 老闆與員工都已經很熟悉試算表的欄位配置，貿然整個換掉會增加訓練成本、也可能漏接舊資料',
        '- 客戶端最常被問的問題是「我的訂單到哪了」，這也是後來把客戶前台獨立出來、讓客戶能自己查詢的主要動機',
      ].join('\n'),
      '[[diagram:userflow]]',
      '[[diagram:prototype]]',
      '## 研究與設計決策',
      '基於這個限制，我做了三個關鍵決策：保留試算表當資料源、但加一層快取，先解決「為什麼卡」的真正瓶頸，而不是重新設計整個資料架構；把客戶會看到的介面跟後台完全拆成兩個獨立服務，同時解決效能（客戶端不用背後台的重量）與資安（客戶端永遠拿不到後台憑證）；權限檢查從「畫面上藏按鈕」搬到「伺服器端逐支 API 擋」——這是我認為最不能妥協的部分，即使多花時間也要做。',
      '## 解法',
      '最終上線的是一套前後台分離的系統：後台涵蓋儀表板、開團管理、訂單、成本與收款記帳、員工結算、庫存、月報表八大模組；客戶前台則是一個乾淨的「查訂單、開團砍單」介面，透過 LINE OA 做身分綁定與到貨通知。另外做了韓國蝦皮／Musinsa／Weverse 的商品資料擷取器，讓上架新團購商品不用再手動謄打。',
      '[[diagram:architecture]]',
      '[[diagram:mockups]]',
      '## 視覺語言',
      '客戶前台沒有另外請設計師做規範，介面刻意做得非常克制——白底、單一強調色、系統預設字體，讓客戶不用學習就能操作，也把行動網路的載入成本壓到最低。',
      '[[diagram:designsystem]]',
      '## 成果與反思',
      '系統目前正式上線且持續迭代中。這個專案讓我學到：好的系統設計不是把舊的全部打掉重做，而是先看懂使用者已經依賴的習慣是什麼、哪些才是真正該解決的痛點，再決定要在哪裡動刀。',
    ],
  },
  {
    id: 'streetdance-learning-platform',
    slug: 'streetdance-learning-platform',
    title: '街舞學習平台 — 沉浸式學習研究',
    description: '碩士論文研究：開發一個支援動作分析與鏡像切換的網頁版街舞教學平台，比較它與傳統鏡像學習對學習投入的影響。',
    tags: ['UX 研究', '學術論文', '互動設計'],
    year: 2026,
    coverColor: '#00C2FF',
    role: '研究者 ／ UX 設計師 ／ 前端開發者',
    duration: '碩士論文研究專案',
    outcome: '完成一套可運作的網頁版動作分析教學平台，並執行正式對照實驗（鏡像學習組 vs. 街舞平台組）搭配問卷與訪談蒐集資料。原規劃用 Unity 做的 3D 化身鏡像模組因時間因素沒有完成，最終研究載體是網頁版平台，而不是當初設想的 3D／VR 版本。',
    caseStudy: [
      '## 問題',
      '街舞學習長期依賴「對著鏡子模仿老師」的方式，但這個方法對學習者沉浸感與學習投入的實際效果，從沒有被系統性驗證過。我想問的是：一個能提供更高沉浸感／臨場感的數位學習平台，是不是真的能讓學習者更投入？',
      '## User Research',
      '這是一份正式的組間對照研究，資料蒐集聚焦三個問題：',
      [
        '- 沉浸感是否能有效帶動三種臨場感——物理、自我、社會',
        '- 這三種臨場感是否能分別對應到行為、認知、情感三種學習投入',
        '- 相較於傳統鏡像學習，網頁平台學習者的主觀感受與投入程度有什麼不同',
      ].join('\n'),
      '資料蒐集方式是量測沉浸感／臨場感／學習投入的問卷，搭配半結構式訪談；研究本身沒有先做大量前期訪談，而是採用「以原型驅動研究」的路徑——唯有先做出一個真的能拿來學習的平台，量到的使用者行為才夠貼近真實情境。',
      '[[diagram:research]]',
      '[[diagram:researchphoto]]',
      '## 設計解法',
      '平台核心是一個網頁版課程系統：課程介紹、學習歷程、動作分析、用戶管理。設計上最關鍵的互動是影片播放器——支援左右鏡像切換（對應老師示範時的鏡像動作，這是街舞學習者最容易搞混的地方）、變速播放、逐幀動作分析疊圖，讓學習者可以照著老師的動作直接對照練習。',
      '[[diagram:userflow]]',
      '## 視覺語言',
      '介面採深色背景搭配單一暖色系標示，讓「左」「右」鏡像方向與動作分析疊圖在螢幕上一眼可辨識，同時降低長時間盯著螢幕練習的視覺疲勞。',
      '[[diagram:designsystem]]',
      '## 成果與誠實的取捨',
      '正式實驗把參與者分成「鏡像學習組」與「街舞平台組」，搭配問卷與訪談蒐集資料進行分析。比較誠實的部分是：一開始規劃做 Unity 3D 化身即時鏡像模組，讓學習者用自己的虛擬化身跟老師互動，但受限於時間沒有做完，正式研究最終是以網頁版平台完成，而不是當初設想的 3D／VR 版本。這也是我學到的一課——把最有把握、能真正拿去驗證假設的版本先做完，比追求功能完整但做不完的版本更重要。',
    ],
  },
]

export function getPlaceholderProjectBySlug(slug: string): PlaceholderProject | null {
  return PLACEHOLDER_PROJECTS.find((p) => p.slug === slug) ?? null
}
