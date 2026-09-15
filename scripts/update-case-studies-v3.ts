/**
 * Inserts real UI mockup gallery / prototype video / research photo markers
 * into the two case studies (on top of the v2 narrative), reusing the same
 * "[[diagram:key]]" mechanism. Run with:
 *   node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/update-case-studies-v3.ts
 */
import { getPayload } from 'payload'
import config from '../payload.config'

const GROUP_BUY_ZH = [
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
]

const GROUP_BUY_EN = [
  '## The Problem',
  "My family's group-buy business ran its back office as a Google Apps Script tool directly on a Google Sheet. As order volume grew, two problems surfaced: pages got slower, and the lag started hurting fulfillment speed; and access control only existed as hidden buttons in the UI — anyone who bypassed the interface could call admin-only operations with no real enforcement. This wasn't a UI redesign problem — it meant rebuilding the foundation without interrupting a business that couldn't afford downtime.",

  '## User Research',
  'Before touching the redesign, I mapped the existing workflow and talked to the owner and staff who use the system every day, surfacing three things that actually needed fixing first:',
  [
    '- The highest-frequency actions are logging new orders and reporting arrivals — any lag there directly delays fulfillment',
    "- The owner and staff already know the spreadsheet's layout well; ripping it out wholesale would add training cost and risk losing old data",
    '- The most common customer question was "where is my order?" — the main reason the customer app was later split out to let customers self-serve that answer',
  ].join('\n'),
  '[[diagram:userflow]]',
  '[[diagram:prototype]]',

  '## Approach & Decisions',
  "Working within that constraint, I made three key decisions: keep the Sheet as the data source but add a cache layer, fixing the actual bottleneck instead of redesigning the whole data architecture; split the customer-facing app from the admin app into two fully separate services, solving both performance (the client never carries the ops app's weight) and security (the client never touches admin credentials) at once; and move access checks from hidden UI buttons to server-side enforcement on every API — the one thing I wasn't willing to compromise on, even if it took longer.",

  '## The Solution',
  'What shipped is a system split into two apps: the ops side covers 8 modules — dashboard, group management, orders, cost/payment bookkeeping, staff settlement, inventory, and monthly reports — while the customer app is a clean "check my order, join a group buy" interface, tied to LINE OA for identity and delivery notifications. I also built scrapers for Korean Shopee, Musinsa and Weverse so new group-buy items no longer need to be typed in by hand.',
  '[[diagram:architecture]]',
  '[[diagram:mockups]]',

  '## Visual Language',
  "The customer app was never handed to a dedicated designer — it's deliberately restrained: white background, a single accent color, the system default typeface, so customers need zero onboarding and mobile data cost stays low.",
  '[[diagram:designsystem]]',

  '## Outcome & Reflection',
  "The system is live and still evolving. The lesson from this project: good systems design isn't about tearing down everything old — it's about understanding what habits users already depend on and which pain points actually need fixing before deciding where to cut.",
]

const DANCE_ZH = [
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
]

const DANCE_EN = [
  '## The Problem',
  "Street dance learning has long relied on copying a teacher's moves in a mirror, but whether that actually drives immersion or engagement had never been tested systematically. The question I wanted to answer: does a digital platform with higher immersion and presence genuinely make learners more engaged?",

  '## User Research',
  'This is a formal between-groups study, with data collection focused on three questions:',
  [
    '- Does immersion effectively drive the three types of presence — physical, self, and social',
    '- Do those three types of presence map onto three types of engagement — behavioral, cognitive, and emotional',
    '- Compared to traditional mirror learning, how do web-platform learners differ in subjective experience and engagement',
  ].join('\n'),
  "Data was collected through immersion/presence/engagement questionnaires plus semi-structured interviews. The research itself skipped heavy up-front interviews in favor of an artifact-driven approach — only a platform people can actually learn from produces behavior close enough to reality to measure.",
  '[[diagram:research]]',
  '[[diagram:researchphoto]]',

  '## Design Solution',
  "The platform is a web-based course system: course intros, learning history, motion analysis, user management. The key interaction is the video player — left/right mirror flipping (matching how a teacher mirrors moves when demonstrating, the single most confusing part for dance learners), variable playback speed, and frame-by-frame motion-analysis overlays so learners can directly compare their form against the instructor's.",
  '[[diagram:userflow]]',

  '## Visual Language',
  "The interface uses a dark background with a single warm accent so the left/right mirror indicators and motion-analysis overlays read instantly on screen, while also easing eye strain during long practice sessions.",
  '[[diagram:designsystem]]',

  '## Outcome & the Honest Trade-off',
  "The formal experiment split participants into a mirror-learning group and a platform-learning group, gathering data through questionnaires and interviews. The honest part: I'd originally planned a Unity-based 3D avatar module for real-time mirrored interaction with the instructor, but it wasn't finished in time — the formal study ran on the web platform instead of the 3D/VR version I'd envisioned. That's the lesson from this project: finishing the version you can actually validate your hypotheses with beats chasing a more complete version you can't finish in time.",
]

async function run() {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({ collection: 'projects' as any, limit: 100, depth: 0 })
  const byslug = (slug: string) => docs.find((d: any) => d.slug === slug)

  const groupBuy = byslug('group-buy-ops')
  if (groupBuy) {
    await payload.update({ collection: 'projects' as any, id: groupBuy.id, locale: 'zh' as any, data: { caseStudy: GROUP_BUY_ZH.join('\n\n') } })
    await payload.update({ collection: 'projects' as any, id: groupBuy.id, locale: 'en' as any, data: { caseStudy: GROUP_BUY_EN.join('\n\n') } })
    console.log('Updated group-buy-ops case study (v3)')
  } else {
    console.log('group-buy-ops not found')
  }

  const dance = byslug('streetdance-learning-platform')
  if (dance) {
    await payload.update({ collection: 'projects' as any, id: dance.id, locale: 'zh' as any, data: { caseStudy: DANCE_ZH.join('\n\n') } })
    await payload.update({ collection: 'projects' as any, id: dance.id, locale: 'en' as any, data: { caseStudy: DANCE_EN.join('\n\n') } })
    console.log('Updated streetdance-learning-platform case study (v3)')
  } else {
    console.log('streetdance-learning-platform not found')
  }

  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
