/**
 * One-off seed script: adds the group-buy platform and street-dance-thesis
 * projects to the CMS. Run once with:
 *   node --env-file=.env.local --import tsx/esm scripts/seed-new-projects.ts
 * Safe to re-run — it skips any slug that already exists.
 */
import { getPayload } from 'payload'
import config from '../payload.config'

async function run() {
  const payload = await getPayload({ config })

  const existing = await payload.find({
    collection: 'projects' as any,
    limit: 100,
    depth: 0,
  })
  const existingSlugs = new Set(existing.docs.map((d: any) => d.slug))

  // ── Cover image for the thesis project (real screenshot of the course
  // platform UI) — the group-buy project ships without one; its bento card
  // just uses a solid colour block like the rest of the grid. ────────────
  let coursePlatformCover: string | undefined
  if (!existingSlugs.has('streetdance-learning-platform')) {
    const media = await payload.create({
      collection: 'media' as any,
      data: { alt: '街舞學習平台的課程介面：影片播放器搭配左右鏡像切換與動作分析' },
      filePath: 'D:\\PersonalFile\\porfolio2026\\photo\\iMac - 1.png',
    })
    coursePlatformCover = String(media.id)
  }

  if (!existingSlugs.has('group-buy-ops')) {
    const doc = await payload.create({
      collection: 'projects' as any,
      locale: 'zh' as any,
      data: {
        title: '代購營運管理系統',
        slug: 'group-buy-ops',
        description: '把代購事業原本跑在 Google Apps Script 上的後台，重寫成前後台分離的正式系統，並串接 LINE OA 處理會員綁定與到貨通知。',
        tags: [{ tag: '產品設計' }, { tag: '全端開發' }, { tag: '系統整合' }],
        year: 2026,
        role: '獨立全端開發者',
        duration: '2026 年 8 月 — 進行中',
        outcome: '完成 8 大後台模組（儀表板、團務、訂單、成本／收款記帳、員工結算、庫存、月報）與獨立客戶前台的正式上線版本；後端補上原本只靠前端隱藏、實際上沒擋住的權限檢查，並用記憶體快取解決 Google Sheets 直接讀寫造成的效能瓶頸。',
        caseStudy: [
          '這套代購後台原本是用 Google Apps Script 直接寫在 Google 試算表上，維運了一段時間之後開始出現效能瓶頸，而且權限控管幾乎不存在——後台功能只是在前端畫面上「藏起來」，任何人只要繞過 UI 就能直接呼叫到不該碰的操作。',
          '我把系統拆成兩個獨立的 Next.js 服務：後台維持用同一份 Google 試算表當資料源（沿用既有的營運習慣，降低轉換成本），但加上一層會自動失效的記憶體快取來緩解試算表 API 的延遲；客戶前台則完全獨立部署，只透過一組公開 API 跟後台溝通，試算表憑證與內部邏輯完全不會落到客戶端。權限這端改成後端用 iron-session 加密 cookie 搭配 bcrypt 雜湊，依角色（admin／staff）在伺服器端擋下每一支 API，而不是像原本只在畫面上隱藏按鈕。',
          '功能面涵蓋儀表板、開團管理、訂單、成本與收款記帳、員工結算、庫存、月報表八大模組，並整合 LINE 官方帳號：客戶端用 LIFF 綁定 LINE 身分、到貨通知透過 Messaging API 推播（失敗會自動重試），另外也做了韓國蝦皮／Musinsa／Weverse 的商品資料擷取器，加快上架新團購商品的速度。',
          '目前系統仍在快速迭代中，這也是我第一次獨立把一個「還在真實營運中、不能中斷」的舊系統，在維持既有資料來源與使用習慣的前提下，逐步遷移成架構更健全的正式產品。',
        ].join('\n\n'),
        featured: true,
        order: 1,
      },
    })
    await payload.update({
      collection: 'projects' as any,
      id: doc.id,
      locale: 'en' as any,
      data: {
        title: 'Group-Buy Operations Platform',
        description: "Rebuilt a group-buying business's back office from a fragile Google Apps Script tool into a proper system split into separate ops and customer apps, with LINE OA integration for identity and delivery notifications.",
        outcome: 'Shipped 8 core ops modules (dashboard, group management, orders, cost/payment bookkeeping, staff settlement, inventory, monthly reports) plus a standalone customer front end. The backend now enforces role checks that used to live only in the UI, and an in-memory cache layer fixed the performance bottleneck of hitting Google Sheets directly.',
        caseStudy: [
          "This group-buy back office used to be a Google Apps Script tool running directly on a Google Sheet. Over time it hit real performance limits, and access control barely existed — admin-only actions were just hidden in the UI, so anyone who bypassed it could call operations they shouldn't.",
          'I split the system into two independent Next.js services. The ops app still uses the same Google Sheet as its data source (keeping the existing workflow the business already relies on) but adds a self-expiring in-memory cache layer to absorb the Sheets API latency. The customer app is deployed completely separately and only talks to the ops app through a public API — spreadsheet credentials and internal logic never reach the client. Access control moved to the backend: iron-session encrypted cookies plus bcrypt hashing, with every API enforcing role checks (admin/staff) server-side instead of just hiding buttons in the UI.',
          "Features span 8 modules — dashboard, group management, orders, cost/payment bookkeeping, staff settlement, inventory, and monthly reports — plus LINE Official Account integration: LIFF login binds a customer's LINE identity, delivery notifications push through the Messaging API with automatic retry on failure, and custom scrapers pull product data from Korean Shopee, Musinsa and Weverse to speed up listing new items.",
          "The system is still evolving quickly. It's also the first time I've independently migrated a live, can't-go-down business tool onto a sturdier architecture while keeping its existing data source and workflow intact.",
        ].join('\n\n'),
      },
    })
    console.log('Created group-buy-ops:', doc.id)
  } else {
    console.log('Skipped group-buy-ops (already exists)')
  }

  if (!existingSlugs.has('streetdance-learning-platform')) {
    const doc = await payload.create({
      collection: 'projects' as any,
      locale: 'zh' as any,
      data: {
        title: '街舞學習平台 — 沉浸式學習研究',
        slug: 'streetdance-learning-platform',
        description: '碩士論文研究：開發一個支援動作分析與鏡像切換的網頁版街舞教學平台，比較它與傳統鏡像學習對學習投入的影響。',
        tags: [{ tag: 'UX 研究' }, { tag: '學術論文' }, { tag: '互動設計' }],
        year: 2026,
        coverImage: coursePlatformCover,
        role: '研究者 ／ UX 設計師 ／ 前端開發者',
        duration: '碩士論文研究專案',
        outcome: '完成一套可運作的網頁版動作分析教學平台，並執行正式對照實驗（鏡像學習組 vs. 街舞平台組）搭配問卷與訪談蒐集資料。原規劃用 Unity 做的 3D 化身鏡像模組因時間因素沒有完成，最終研究載體是網頁版平台，而不是當初設想的 3D／VR 版本。',
        caseStudy: [
          '這個研究想回答的問題是：一個街舞學習平台如果能提供更高的「沉浸感」與「臨場感」，是不是真的能提升學習者的投入程度，相較於傳統對著鏡子模仿老師動作的學習方式？研究架構把沉浸感拆成物理／自我／社會三種臨場感，再對應到行為、認知、情感三種學習投入，建立了一組要驗證的假設模型。',
          '在研發方法上，我沒有照傳統線性 UX 流程走，而是採用「以原型驅動研究」的路徑：探索既有街舞學習平台案例 → 確認核心功能與技術選擇 → 直接做出一個功能完整的 MVP，再拿到真實的街舞學習情境中測試，而不是先做大量前期訪談。理由是唯有先有一個可以真的拿來學習的平台，量到的使用者行為與心智模型才夠貼近實際情境。',
          '平台本身是一個網頁版的課程平台，功能包含課程介紹、學習歷程、動作分析、用戶管理；影片播放器支援左右鏡像切換（對應街舞老師示範時的鏡像動作）、變速播放、逐幀動作分析疊圖，讓學習者可以照著老師的動作對照練習。',
          '正式實驗把參與者分成「鏡像學習組」與「街舞平台組」兩組，搭配問卷與訪談蒐集沉浸感、臨場感、學習投入的資料進行分析。比較誠實的部分是：一開始規劃想做 Unity 3D 化身即時鏡像模組，讓學習者用自己的虛擬化身跟老師互動，但受限於時間，這個模組最後沒有做完，正式研究還是以網頁版平台完成。這也是我在做研究規劃時學到的一課——把最有把握做出來、能真正拿去驗證假設的版本先做完，比追求功能完整但做不完的版本更重要。',
        ].join('\n\n'),
        featured: true,
        order: 2,
      },
    })
    await payload.update({
      collection: 'projects' as any,
      id: doc.id,
      locale: 'en' as any,
      data: {
        title: 'Street Dance Learning Platform — Immersive Learning Research',
        description: "Master's thesis: built a web-based street-dance course platform with mirrored playback and motion analysis, and compared it against traditional mirror-based learning for its effect on learner engagement.",
        outcome: 'Delivered a working web-based motion-analysis course platform and ran a formal between-groups experiment (mirror learning vs. platform learning) with questionnaires and interviews. The originally planned Unity 3D avatar-mirroring module was not completed due to time constraints, so the web platform — not the envisioned 3D/VR version — ended up being the actual research vehicle.',
        caseStudy: [
          "The research question: does a street-dance learning platform with higher immersion and presence actually increase learner engagement, compared to the traditional approach of copying a teacher's moves in a mirror? The model breaks immersion down into physical, self, and social presence, each mapped to behavioral, cognitive, and emotional engagement — a set of hypotheses to test.",
          "Instead of a traditional linear UX process, I used an artifact-driven research approach: survey existing dance-learning platforms, lock down core features and tech choices, then go straight to building a fully functional MVP and test it in a real dance-learning setting rather than front-loading interviews. The idea is that only a platform people can actually learn from produces user behavior and mental models close enough to reality to measure.",
          'The platform is a web-based course system covering course intros, learning history, motion analysis, and user management. Its video player supports left/right mirror flipping (matching how a dance teacher mirrors movements when demonstrating), variable playback speed, and frame-by-frame motion-analysis overlays so learners can compare their form against the instructor.',
          "The formal experiment split participants into a mirror-learning group and a platform-learning group, gathering immersion, presence, and engagement data through questionnaires and interviews. The honest part: I'd originally planned a Unity-based 3D avatar module for real-time mirrored interaction with the instructor, but it didn't get finished in time, so the formal study ran on the web platform instead. That's also the lesson from this project — finishing the version you can actually validate your hypotheses with beats chasing a more complete version you can't finish in time.",
        ].join('\n\n'),
      },
    })
    console.log('Created streetdance-learning-platform:', doc.id)
  } else {
    console.log('Skipped streetdance-learning-platform (already exists)')
  }

  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
