import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ProjectDetailPage } from '@/components/sections/ProjectDetailPage'
import { getProjectBySlug, getProjectSlugs } from '@/lib/payload'
import { PLACEHOLDER_PROJECTS, getPlaceholderProjectBySlug } from '@/lib/placeholderProjects'
import {
  GroupBuyArchitectureDiagram, GroupBuyUserFlowDiagram,
  ResearchFlowDiagram, DanceUserFlowDiagram,
  DesignSystemSnapshot, MockupGallery, PrototypeVideo, PhotoHighlight,
} from '@/components/ui/CaseStudyDiagrams'

// Hand-built diagrams only exist for these two case studies — everything
// else (including CMS-authored projects) just renders without one. Keys
// here must match the "[[diagram:key]]" markers placed in each project's
// caseStudy text (see scripts/update-case-studies.ts).
const DIAGRAMS: Record<string, Record<string, React.ReactNode>> = {
  'group-buy-ops': {
    architecture: <GroupBuyArchitectureDiagram />,
    userflow: <GroupBuyUserFlowDiagram />,
    designsystem: (
      <DesignSystemSnapshot
        title="視覺語言（客戶前台實際上線畫面）"
        swatches={[
          { name: '內文', hex: '#26262A', on: 'light' },
          { name: '輔助文字', hex: '#6B6B72', on: 'light' },
          { name: '強調色', hex: '#87394B' },
          { name: '背景', hex: '#FFFFFF', on: 'light' },
        ]}
        typeface="系統預設無襯線字體（不額外載入字型，優先壓低行動網路的載入成本）"
      />
    ),
    mockups: (
      <MockupGallery
        title="UI Mockup（實際上線畫面截圖）"
        shots={[
          { src: '/case-studies/group-buy/ops-dashboard.png', alt: '後台 Dashboard', label: 'Ops — Dashboard' },
          { src: '/case-studies/group-buy/ops-orders.png', alt: '後台訂單管理', label: 'Ops — 訂單管理' },
          { src: '/case-studies/group-buy/ops-groups.png', alt: '後台團務管理', label: 'Ops — 團務管理' },
          { src: '/case-studies/group-buy/ops-costs.png', alt: '後台成本記帳', label: 'Ops — 成本記帳' },
          { src: '/case-studies/group-buy/front-home.png', alt: '客戶前台首頁', label: 'Customer — 首頁' },
          { src: '/case-studies/group-buy/front-groups.png', alt: '客戶前台開團列表', label: 'Customer — 開團列表' },
        ]}
      />
    ),
    prototype: (
      <PrototypeVideo
        title="Prototype Walkthrough（下單流程錄影）"
        src="/case-studies/group-buy/prototype-order-flow.mp4"
        note="客戶端實際操作錄影：瀏覽開團、選規格與數量、送出訂單。"
      />
    ),
  },
  'streetdance-learning-platform': {
    research: <ResearchFlowDiagram />,
    userflow: <DanceUserFlowDiagram />,
    designsystem: (
      <DesignSystemSnapshot
        title="視覺語言（課程平台介面）"
        approximate
        swatches={[
          { name: '介面背景', hex: '#4A4A4E' },
          { name: '側邊欄', hex: '#1C1C20' },
          { name: '鏡像方向標示', hex: '#C1592E' },
          { name: '文字／圖示', hex: '#F2F2F2' },
        ]}
        typeface="系統無襯線字體＋等寬數字（時間軸、毫秒延遲數值）"
      />
    ),
    researchphoto: (
      <PhotoHighlight
        src="/case-studies/dance/user-research-session.jpg"
        alt="正式實驗現場，參與者面對螢幕跟著課程平台練習"
        caption="正式實驗現場一景——參與者面對螢幕跟著平台上的示範動作練習。"
      />
    ),
  },
}

type Props = { params: Promise<{ slug: string; locale: string }> }

export async function generateStaticParams() {
  const slugs = await getProjectSlugs()
  // The CMS is currently unreachable in this environment, so also generate
  // static params for the placeholder projects — otherwise their detail
  // pages would 404 (empty CMS slug list -> no static paths).
  const all = new Set([...slugs, ...PLACEHOLDER_PROJECTS.map((p) => p.slug)])
  return [...all].map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params
  const project = await getProjectBySlug(slug, locale) ?? getPlaceholderProjectBySlug(slug)
  if (!project) return {}
  return { title: `${project.title} — Ray` }
}

export default async function Page({ params }: Props) {
  const { slug, locale } = await params
  const project = await getProjectBySlug(slug, locale) ?? getPlaceholderProjectBySlug(slug)
  if (!project) notFound()

  return (
    <ProjectDetailPage
      diagrams={DIAGRAMS[slug]}
      project={{
        slug: project.slug,
        title: project.title,
        description: project.description,
        tags: project.tags,
        year: project.year,
        coverColor: project.coverColor,
        coverSrc: project.coverSrc,
        liveUrl: project.liveUrl,
        role: project.role,
        duration: project.duration,
        outcome: project.outcome,
        caseStudy: project.caseStudy,
        gallery: 'gallery' in project ? project.gallery : undefined,
      }}
    />
  )
}
