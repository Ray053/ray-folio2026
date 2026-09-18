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
          { name: 'Accent', hex: '#A34C5F' },
          { name: 'Accent Deep', hex: '#87394B' },
          { name: 'Warn', hex: '#B8823A' },
          { name: 'Ink (text)', hex: '#26262A', on: 'light' },
          { name: 'Muted (text)', hex: '#6B6B72', on: 'light' },
          { name: 'Paper (surface)', hex: '#FBFAF8', on: 'light' },
          { name: 'Page background', hex: '#F2F0ED', on: 'light' },
          { name: 'Line', hex: 'rgba(38,38,42,0.11)', on: 'light' },
        ]}
        typography={[
          { name: 'Display — Huninn (custom webfont; system fallback shown)', fontFamily: 'system-ui, -apple-system, sans-serif', weights: [400] },
          { name: 'Body — System Sans', fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif', weights: [400, 500, 700, 800] },
        ]}
        radii={[
          { name: 'Alert', value: '10px' },
          { name: 'Input / Tab', value: '12px' },
          { name: 'Button / Icon', value: '13px' },
          { name: 'Bar / Panel', value: '16px' },
          { name: 'Card', value: '18px' },
          { name: 'Pill', value: '999px' },
        ]}
        icons={[
          { name: 'Help', svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
          { name: 'Bag', svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg> },
          { name: 'Chevron', svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg> },
          { name: 'Search', svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg> },
          { name: 'Bell', svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg> },
          { name: 'Check', svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> },
        ]}
        components={[
          {
            name: 'Primary Button（送出喊單）',
            states: [
              { label: 'Default', node: (
                <button style={{ minHeight: '50px', padding: '0 24px', border: '1px solid #A34C5F', borderRadius: '13px', color: '#fff', backgroundColor: '#A34C5F', boxShadow: '0 9px 20px rgba(163,76,95,0.2)', fontSize: '15px', fontWeight: 800, cursor: 'pointer' }}>送出喊單</button>
              ) },
              { label: 'Active（按下）', node: (
                <button style={{ minHeight: '50px', padding: '0 24px', border: '1px solid #A34C5F', borderRadius: '13px', color: '#fff', backgroundColor: '#A34C5F', boxShadow: '0 9px 20px rgba(163,76,95,0.2)', fontSize: '15px', fontWeight: 800, cursor: 'pointer', transform: 'translateY(1px)' }}>送出喊單</button>
              ) },
              { label: 'Disabled', node: (
                <button disabled style={{ minHeight: '50px', padding: '0 24px', border: '1px solid #A34C5F', borderRadius: '13px', color: '#fff', backgroundColor: '#A34C5F', fontSize: '15px', fontWeight: 800, cursor: 'wait', opacity: 0.65 }}>送出喊單</button>
              ) },
            ],
          },
          {
            name: 'Task Row（首頁功能入口 — hover 用色塊由點擊處暈開）',
            states: [
              { label: 'Default', node: (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '220px', padding: '10px 16px', border: '1px solid rgba(38,38,42,0.11)', borderRadius: '18px', backgroundColor: 'rgba(255,255,255,0.68)' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#26262A' }}>查詢我的訂單</span>
                </div>
              ) },
              { label: 'Hover（暈染展開）', node: (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '220px', padding: '10px 16px', border: '1px solid rgba(163,76,95,0.24)', borderRadius: '18px', backgroundColor: 'rgba(163,76,95,0.09)' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#A34C5F' }}>查詢我的訂單</span>
                </div>
              ) },
              { label: 'Focus-visible', node: (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '220px', padding: '10px 16px', border: '1px solid rgba(163,76,95,0.24)', borderRadius: '18px', backgroundColor: 'rgba(163,76,95,0.09)', outline: '3px solid rgba(163,76,95,0.25)', outlineOffset: '2px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#A34C5F' }}>查詢我的訂單</span>
                </div>
              ) },
            ],
          },
          {
            name: 'Text Input（喊單表單欄位）',
            states: [
              { label: 'Default', node: (
                <input readOnly value="數量" style={{ minHeight: '44px', width: '140px', padding: '0 13px', border: '1px solid rgba(38,38,42,0.14)', borderRadius: '12px', color: '#26262A', backgroundColor: 'rgba(255,255,255,0.86)', fontSize: '14px', fontWeight: 500 }} />
              ) },
              { label: 'Focus', node: (
                <input readOnly value="數量" style={{ minHeight: '44px', width: '140px', padding: '0 13px', border: '1px solid rgba(38,38,42,0.14)', borderRadius: '12px', color: '#26262A', backgroundColor: 'rgba(255,255,255,0.86)', fontSize: '14px', fontWeight: 500, outline: '3px solid rgba(163,76,95,0.25)', outlineOffset: '2px' }} />
              ) },
              { label: 'Invalid', node: (
                <input readOnly value="數量" aria-invalid style={{ minHeight: '44px', width: '140px', padding: '0 13px', border: '1px solid #A34C5F', borderRadius: '12px', color: '#26262A', backgroundColor: 'rgba(255,255,255,0.86)', fontSize: '14px', fontWeight: 500 }} />
              ) },
            ],
          },
          {
            name: 'Segmented Tab（教學面板分類）',
            states: [
              { label: 'Default', node: (
                <button style={{ padding: '10px 14px', border: '1px solid rgba(38,38,42,0.11)', borderRadius: '12px', color: '#6B6B72', backgroundColor: 'rgba(255,255,255,0.72)', fontSize: '12px', fontWeight: 750, cursor: 'pointer' }}>查訂單</button>
              ) },
              { label: 'Selected', node: (
                <button style={{ padding: '10px 14px', border: '1px solid rgba(163,76,95,0.32)', borderRadius: '12px', color: '#87394B', backgroundColor: 'rgba(163,76,95,0.08)', fontSize: '12px', fontWeight: 750, cursor: 'pointer' }}>查訂單</button>
              ) },
            ],
          },
          {
            name: 'Notice / Alert',
            states: [
              { label: '一般提示', node: (
                <div style={{ padding: '11px 12px', borderRadius: '10px', color: '#5D5859', backgroundColor: 'rgba(38,38,42,0.055)', fontSize: '12px', fontWeight: 500 }}>喊單截止前可修改數量</div>
              ) },
              { label: '成功', node: (
                <div style={{ padding: '11px 12px', borderRadius: '10px', color: '#4D5E4C', backgroundColor: 'rgba(79,111,78,0.1)', fontSize: '12px', fontWeight: 500 }}>訂單已送出</div>
              ) },
              { label: '錯誤', node: (
                <div style={{ padding: '11px 12px', borderRadius: '10px', color: '#87394B', backgroundColor: 'rgba(163,76,95,0.1)', fontSize: '12px', fontWeight: 500 }}>此團已截止喊單</div>
              ) },
            ],
          },
          {
            name: 'Status Tag（後台訂單狀態）',
            states: [
              { label: '預購中', node: (
                <span style={{ padding: '4px 10px', backgroundColor: 'rgba(38,38,42,0.08)', color: '#26262A', borderRadius: '999px', fontSize: '12px', fontWeight: 500 }}>預購中</span>
              ) },
              { label: '已結單', node: (
                <span style={{ padding: '4px 10px', backgroundColor: '#5B6FA3', color: '#fff', borderRadius: '999px', fontSize: '12px', fontWeight: 500 }}>已結單</span>
              ) },
              { label: '已出貨', node: (
                <span style={{ padding: '4px 10px', backgroundColor: '#3D7A5C', color: '#fff', borderRadius: '999px', fontSize: '12px', fontWeight: 500 }}>已出貨</span>
              ) },
              { label: '已逾期', node: (
                <span style={{ padding: '4px 10px', backgroundColor: '#B5651D', color: '#fff', borderRadius: '999px', fontSize: '12px', fontWeight: 500 }}>已逾期</span>
              ) },
            ],
          },
          {
            name: 'Focus Ring（站內唯一一套 focus 樣式，套用在所有互動元件上，不是每個元件各自定義）',
            states: [
              { label: '3px solid rgba(163,76,95,.25) · offset 2px', node: (
                <div style={{ width: '44px', height: '44px', borderRadius: '13px', border: '1px solid rgba(38,38,42,0.11)', backgroundColor: 'rgba(255,255,255,0.86)', outline: '3px solid rgba(163,76,95,0.25)', outlineOffset: '2px' }} />
              ) },
            ],
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
          { src: '/case-studies/group-buy/front-home.png', alt: '客戶前台首頁', label: '首頁', group: 'customer-mobile' },
          { src: '/case-studies/group-buy/front-groups.png', alt: '客戶前台開團列表', label: '開團列表', group: 'customer-mobile' },
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
        icons={[
          { name: 'Play', svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> },
          { name: 'Pause', svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> },
          { name: 'Rewind', svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 19 2 12 11 5 11 19"/><polygon points="22 19 13 12 22 5 22 19"/></svg> },
          { name: 'Mirror', svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18"/><path d="m8 6-4 6 4 6"/><path d="m16 6 4 6-4 6"/></svg> },
          { name: 'Frame', svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="M15 3v18"/></svg> },
          { name: 'Layers', svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg> },
        ]}
        components={[
          {
            name: 'Direction Labels',
            states: [
              { label: '← 左', node: (
                <span style={{ padding: '6px 14px', backgroundColor: '#C1592E', color: '#fff', borderRadius: '4px', fontSize: '13px', fontWeight: 600 }}>← 左</span>
              ) },
              { label: '右 →', node: (
                <span style={{ padding: '6px 14px', backgroundColor: '#2A6BC1', color: '#fff', borderRadius: '4px', fontSize: '13px', fontWeight: 600 }}>右 →</span>
              ) },
            ],
          },
          {
            name: 'Control Button — Play',
            states: [
              { label: 'Default', node: (
                <button style={{ padding: '8px 16px', backgroundColor: '#C1592E', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 500, cursor: 'pointer' }}>播放</button>
              ) },
              { label: 'Hover', node: (
                <button style={{ padding: '8px 16px', backgroundColor: '#A34A26', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 500, cursor: 'pointer', boxShadow: '0 4px 10px rgba(193,89,46,0.4)' }}>播放</button>
              ) },
              { label: 'Focus', node: (
                <button style={{ padding: '8px 16px', backgroundColor: '#C1592E', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 500, cursor: 'pointer', outline: '2px solid #F2F2F2', outlineOffset: '2px' }}>播放</button>
              ) },
              { label: 'Active', node: (
                <button style={{ padding: '8px 16px', backgroundColor: '#8A3D1F', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 500, cursor: 'pointer', transform: 'scale(0.96)' }}>播放</button>
              ) },
            ],
          },
          {
            name: 'Control Button — Speed',
            states: [
              { label: 'Default', node: (
                <button style={{ padding: '8px 16px', backgroundColor: '#2A2A2E', color: '#F2F2F2', border: '1px solid #4A4A4E', borderRadius: '4px', fontWeight: 500, cursor: 'pointer' }}>0.5x</button>
              ) },
              { label: 'Selected', node: (
                <button style={{ padding: '8px 16px', backgroundColor: '#4A4A4E', color: '#fff', border: '1px solid #C1592E', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' }}>0.5x</button>
              ) },
              { label: 'Focus', node: (
                <button style={{ padding: '8px 16px', backgroundColor: '#2A2A2E', color: '#F2F2F2', border: '1px solid #4A4A4E', borderRadius: '4px', fontWeight: 500, cursor: 'pointer', outline: '2px solid #F2F2F2', outlineOffset: '2px' }}>0.5x</button>
              ) },
              { label: 'Disabled', node: (
                <button disabled style={{ padding: '8px 16px', backgroundColor: '#2A2A2E', color: '#F2F2F2', border: '1px solid #4A4A4E', borderRadius: '4px', fontWeight: 500, cursor: 'not-allowed', opacity: 0.35 }}>0.5x</button>
              ) },
            ],
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
