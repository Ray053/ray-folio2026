/**
 * Enriches the group-buy-ops case study with details from the actual,
 * more mature codebase (jessie9527/group-buy-ops + group-buy-frontend on
 * GitHub): the RPC-registry dispatch pattern, CORS/rate-limited public API,
 * LINE LIFF + signature-verified webhook confirm flow, self-serve account
 * management, and the reasoning for skipping serverless deployment.
 * Run with:
 *   node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/enrich-groupbuy-case-study.ts
 */
import { getPayload } from 'payload'
import config from '../payload.config'

const ZH_OUTCOME = '完成 8 大後台模組（儀表板、團務、訂單、成本／收款記帳、員工結算、庫存、月報）與獨立客戶前台的正式上線版本；後端用 RPC 對照表逐支 API 做角色權限檢查，補上原本只靠前端隱藏、實際上沒擋住的漏洞；記憶體快取解決了 Google Sheets 直接讀寫的效能瓶頸；客戶端則透過 LINE LIFF 身分綁定＋簽章驗證的 Webhook，完成推播通知與對話內確認喊單的雙向溝通。'

const ZH_SOLUTION = '最終上線的是一套前後台分離的系統：後台涵蓋儀表板、開團管理、訂單、成本與收款記帳、員工結算、庫存、月報表八大模組，內部所有函式都是原本 Apps Script `Code.gs` 的 1:1 TypeScript port，透過一份 RPC 對照表統一由單一端點派發——前端呼叫方式跟原本的 `google.script.run.xxx()` 幾乎一樣，只是走 HTTP，把遷移風險降到最低。客戶前台則是一個乾淨的「查訂單、開團砍單」介面，只透過一組有 CORS 白名單與頻率限制的公開 API 跟後台溝通，完全拿不到 Google 憑證；身分綁定用 LINE LIFF 完成，到貨與喊單成立會主動推播，客戶也能直接在 LINE 對話裡按「確認喊單內容」，後台用簽章驗證的 Webhook 接收這個事件並即時回覆——這段刻意用 reply 而不是 push，避免多耗推播額度。另外做了韓國蝦皮／Musinsa／Weverse 的商品資料擷取器，讓上架新團購商品不用再手動謄打。'

const ZH_REFLECTION = '系統目前正式上線且持續迭代中，帳號管理也已經從「改環境變數、重新部署」變成後台一個獨立頁面就能自助處理（新增帳號、改角色、重設密碼）。部署上刻意不選 Vercel 的免費 serverless——這次效能優化的關鍵正是常駐行程裡的記憶體快取，一旦跑在 serverless、每次 cold start 就會把快取歸零，等於白做這次遷移，所以最後選擇長駐的 Node process。這個專案讓我學到：好的系統設計不是把舊的全部打掉重做，而是先看懂使用者已經依賴的習慣是什麼、哪些才是真正該解決的痛點，再決定要在哪裡動刀——包括「不要用看起來比較潮的架構」這種決定。'

const EN_OUTCOME = 'Shipped 8 core ops modules (dashboard, group management, orders, cost/payment bookkeeping, staff settlement, inventory, monthly reports) plus a standalone customer front end. The backend now enforces per-API role checks through an RPC registry, closing a gap that used to be UI-only; an in-memory cache layer fixed the Google Sheets performance bottleneck; and the customer side binds identity via LINE LIFF with a signature-verified webhook for two-way delivery notifications and in-chat confirmation.'

const EN_SOLUTION = 'What shipped is a system split into two apps: the ops side covers 8 modules — dashboard, group management, orders, cost/payment bookkeeping, staff settlement, inventory, and monthly reports — where every function is a 1:1 TypeScript port of the original Apps Script `Code.gs`, dispatched through a single endpoint via an RPC registry, so the frontend calls it almost exactly like the old `google.script.run.xxx()`, just over HTTP, which kept migration risk low. The customer app is a clean "check my order, join a group buy" interface that only talks to the ops app through a public API locked down with a CORS allowlist and rate limiting — it never touches Google credentials. Identity binds through LINE LIFF, delivery and new-group-buy events push notifications, and customers can also tap "Confirm" right inside the LINE chat — a signature-verified webhook picks that up and replies instantly (a reply, not a push, so it doesn\'t eat into the monthly push quota). I also built scrapers for Korean Shopee, Musinsa and Weverse so new group-buy items no longer need to be typed in by hand.'

const EN_REFLECTION = 'The system is live and still evolving — account management has also moved from "edit an env var and redeploy" to a self-serve admin page (add accounts, change roles, reset passwords). Deployment deliberately skipped Vercel\'s free serverless tier: the whole performance fix hinges on an in-memory cache inside a long-running process, and serverless cold starts would zero that cache out every time, undoing the point of the migration — so it runs on a persistent Node process instead. The lesson from this project: good systems design isn\'t about tearing down everything old — it\'s about understanding what habits users already depend on and which pain points actually need fixing before deciding where to cut, including deciding not to reach for the trendier-looking architecture.'

function replaceSection(caseStudy: string, heading: string, nextHeadingOrMarker: string | null, replacement: string): string {
  const start = caseStudy.indexOf(heading)
  if (start === -1) throw new Error(`heading not found: ${heading}`)
  const contentStart = start + heading.length
  if (nextHeadingOrMarker === null) {
    return caseStudy.slice(0, contentStart) + '\n\n' + replacement
  }
  const end = caseStudy.indexOf(nextHeadingOrMarker, contentStart)
  if (end === -1) throw new Error(`next marker not found after ${heading}: ${nextHeadingOrMarker}`)
  return caseStudy.slice(0, contentStart) + '\n\n' + replacement + '\n\n' + caseStudy.slice(end)
}

async function run() {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'projects' as any, limit: 1, depth: 0,
    where: { slug: { equals: 'group-buy-ops' } },
  })
  const doc = docs[0] as any
  if (!doc) { console.log('group-buy-ops not found'); process.exit(1) }

  // zh
  {
    let cs: string = doc.caseStudy
    cs = replaceSection(cs, '## 解法', '[[diagram:architecture]]', ZH_SOLUTION)
    cs = replaceSection(cs, '## 成果與反思', null, ZH_REFLECTION)
    await payload.update({
      collection: 'projects' as any, id: doc.id, locale: 'zh' as any,
      data: { outcome: ZH_OUTCOME, caseStudy: cs },
    })
    console.log('Updated zh')
  }

  // en
  {
    const { docs: enDocs } = await payload.find({
      collection: 'projects' as any, limit: 1, depth: 0, locale: 'en' as any,
      where: { slug: { equals: 'group-buy-ops' } },
    })
    let cs: string = (enDocs[0] as any).caseStudy
    cs = replaceSection(cs, '## The Solution', '[[diagram:architecture]]', EN_SOLUTION)
    cs = replaceSection(cs, '## Outcome & Reflection', null, EN_REFLECTION)
    await payload.update({
      collection: 'projects' as any, id: doc.id, locale: 'en' as any,
      data: { outcome: EN_OUTCOME, caseStudy: cs },
    })
    console.log('Updated en')
  }

  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
