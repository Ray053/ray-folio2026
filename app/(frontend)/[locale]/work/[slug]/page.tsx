import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ProjectDetailPage } from '@/components/sections/ProjectDetailPage'
import { getProjectBySlug, getProjectSlugs } from '@/lib/payload'
import { PLACEHOLDER_PROJECTS, getPlaceholderProjectBySlug } from '@/lib/placeholderProjects'
import {
  GroupBuyArchitectureDiagram, GroupBuyUserFlowDiagram,
  ResearchFlowDiagram, DanceUserFlowDiagram,
  DesignSystemSection, MockupGallery, PrototypeVideo, PhotoHighlight,
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
      <DesignSystemSection
        colors={[
          { name: 'Primary', hex: '#87394B' },
          { name: 'Text', hex: '#26262A', on: 'light' },
          { name: 'Secondary', hex: '#6B6B72', on: 'light' },
          { name: 'Background', hex: '#FFFFFF', on: 'light' },
          { name: 'Surface', hex: '#F5F5F5', on: 'light' },
          { name: 'Border', hex: '#E5E5E5', on: 'light' },
        ]}
        typography={[
          { name: 'System Sans', fontFamily: 'system-ui, -apple-system, sans-serif', weights: [400, 500, 600, 700] },
        ]}
        components={[
          {
            name: 'Buttons',
            preview: (
              <>
                <button style={{ padding: '10px 20px', backgroundColor: '#87394B', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 500, cursor: 'pointer' }}>Primary</button>
                <button style={{ padding: '10px 20px', backgroundColor: 'transparent', color: '#26262A', border: '1px solid #E5E5E5', borderRadius: '6px', fontWeight: 500, cursor: 'pointer' }}>Secondary</button>
              </>
            ),
          },
          {
            name: 'Tags',
            preview: (
              <>
                <span style={{ padding: '4px 10px', backgroundColor: '#F5F5F5', color: '#26262A', borderRadius: '4px', fontSize: '12px', fontWeight: 500 }}>預購中</span>
                <span style={{ padding: '4px 10px', backgroundColor: '#87394B', color: '#fff', borderRadius: '4px', fontSize: '12px', fontWeight: 500 }}>已結單</span>
              </>
            ),
          },
        ]}
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
      <DesignSystemSection
        colors={[
          { name: 'Background', hex: '#4A4A4E' },
          { name: 'Sidebar', hex: '#1C1C20' },
          { name: 'Accent', hex: '#C1592E' },
          { name: 'Text', hex: '#F2F2F2' },
          { name: 'Muted', hex: '#8A8A8E' },
          { name: 'Surface', hex: '#2A2A2E' },
        ]}
        typography={[
          { name: 'System Sans', fontFamily: 'system-ui, -apple-system, sans-serif', weights: [400, 500, 700] },
          { name: 'Monospace', fontFamily: 'ui-monospace, monospace', weights: [400, 600] },
        ]}
        components={[
          {
            name: 'Direction Labels',
            preview: (
              <>
                <span style={{ padding: '6px 14px', backgroundColor: '#C1592E', color: '#fff', borderRadius: '4px', fontSize: '13px', fontWeight: 600 }}>← 左</span>
                <span style={{ padding: '6px 14px', backgroundColor: '#2A6BC1', color: '#fff', borderRadius: '4px', fontSize: '13px', fontWeight: 600 }}>右 →</span>
              </>
            ),
          },
          {
            name: 'Controls',
            preview: (
              <>
                <button style={{ padding: '8px 16px', backgroundColor: '#C1592E', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 500, cursor: 'pointer' }}>播放</button>
                <button style={{ padding: '8px 16px', backgroundColor: '#2A2A2E', color: '#F2F2F2', border: '1px solid #4A4A4E', borderRadius: '4px', fontWeight: 500, cursor: 'pointer' }}>0.5x</button>
              </>
            ),
          },
        ]}
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
