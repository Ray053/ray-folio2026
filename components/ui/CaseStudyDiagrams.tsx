'use client'
import { useId } from 'react'
import Image from 'next/image'

// Hand-built process/architecture diagrams for specific case studies, drawn
// in the site's own Bauhaus hard-block language (2px ink border, offset
// shadow, solid accent fills) instead of embedding the original slide
// exports. Neutral boxes follow the light/dark theme; colored boxes use
// fixed hex pairs (see FIXED_* below) so contrast never depends on which
// theme is active.
//
// Accessibility: these are decorative restatements of content already in the
// surrounding prose, so each <svg> carries role="img" + a plain-language
// aria-label summarizing the whole diagram, and its inner marks are grouped
// under aria-hidden — otherwise a screen reader would read every floating
// <text> node in DOM order, which doesn't reconstruct the diagram's meaning.

const ink = 'var(--color-ink)'
const bg = 'var(--color-background)'
const surface = 'var(--color-surface)'
const muted = 'var(--color-text-secondary)'
const border = 'var(--color-border)'

// Fixed (non-theme-following) fill/text pairs for the colored boxes. Picked
// and pinned specifically for contrast, not sourced from --color-accent /
// --color-acid: those tokens intentionally shift between light and dark mode
// (accent gets lighter in dark mode so it still pops against a near-black
// page), but a lighter accent behind white text drops to ~3.5:1 — below
// WCAG AA's 4.5:1 for text this size (13px bold doesn't qualify as "large
// text"). Pinning the pair keeps every combination here at 7:1+ always.
const FIXED_BLUE = { fill: '#0033FF', text: '#FFFFFF' }       // 7.5:1
const FIXED_DEEP_BLUE = { fill: '#001A80', text: '#FFFFFF' }  // 14.5:1
const FIXED_ACID = { fill: '#CCFF00', text: '#0A0A0A' }       // 17:1

function Box({
  x, y, w, h, fill, textColor = '#fff', label, sublabel,
}: {
  x: number; y: number; w: number; h: number
  fill: string; textColor?: string; label: string; sublabel?: string
}) {
  return (
    <g>
      {/* hard shadow */}
      <rect x={x + 5} y={y + 5} width={w} height={h} style={{ fill: ink }} />
      <rect x={x} y={y} width={w} height={h} style={{ fill, stroke: ink, strokeWidth: 2 }} />
      <text x={x + w / 2} y={y + h / 2 + (sublabel ? -6 : 5)} textAnchor="middle"
        style={{ fill: textColor, fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' }}>
        {label}
      </text>
      {sublabel && sublabel.split('\n').map((line, i) => (
        <text key={i} x={x + w / 2} y={y + h / 2 + 14 + i * 13} textAnchor="middle"
          style={{ fill: textColor, fontSize: 10, opacity: 0.85, fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' }}>
          {line}
        </text>
      ))}
    </g>
  )
}

function Arrow({ x1, y1, x2, y2, markerId }: { x1: number; y1: number; x2: number; y2: number; markerId: string }) {
  return (
    <line x1={x1} y1={y1} x2={x2} y2={y2}
      style={{ stroke: muted, strokeWidth: 2 }}
      markerEnd={`url(#${markerId})`} />
  )
}

type FlowStep = { label: string; sub?: string; tone?: 'neutral' | 'blue' | 'acid' }

/** A left-to-right sequence of boxes joined by arrows — used for both
 * research-process flows and product user flows. */
function FlowChart({ steps, ariaLabel }: { steps: FlowStep[]; ariaLabel: string }) {
  const markerId = `arrow-${useId()}`
  const w = 155, gap = 20, h = 90
  return (
    <svg viewBox={`0 0 ${steps.length * (w + gap) - gap} ${h + 20}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}
      role="img" aria-label={ariaLabel} focusable="false">
      <defs>
        <marker id={markerId} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" style={{ fill: muted }} />
        </marker>
      </defs>
      <g aria-hidden="true">
        {steps.map((s, i) => {
          const x = i * (w + gap)
          const { fill, text } = s.tone === 'blue'
            ? FIXED_BLUE
            : s.tone === 'acid'
              ? FIXED_ACID
              : { fill: bg, text: ink }
          return (
            <g key={s.label}>
              <Box x={x} y={0} w={w} h={h} fill={fill} textColor={text} label={s.label} sublabel={s.sub} />
              {i < steps.length - 1 && <Arrow markerId={markerId} x1={x + w + 5} y1={h / 2} x2={x + w + gap} y2={h / 2} />}
            </g>
          )
        })}
      </g>
    </svg>
  )
}

/** Group-buy: legacy single-script tool -> cache-backed ops app + isolated
 * customer app talking only through a public API, with LINE OA on the side. */
export function GroupBuyArchitectureDiagram() {
  const markerId = `arrow-${useId()}`
  return (
    <svg viewBox="0 0 720 300" style={{ width: '100%', height: 'auto', overflow: 'visible' }}
      role="img"
      aria-label="架構圖：Google Sheet 作為唯一資料源，同時餵給有記憶體快取的代購後台 Ops App，以及獨立部署的客戶前台 App；兩者透過一組公開 API 溝通，客戶端完全拿不到後台憑證；後台另外整合 LINE 官方帳號做身分綁定與推播通知給客戶。"
      focusable="false">
      <defs>
        <marker id={markerId} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" style={{ fill: muted }} />
        </marker>
      </defs>

      <g aria-hidden="true">
        <Box x={20} y={130} w={150} h={60} fill={bg} textColor={ink} label="Google Sheet" sublabel="唯一資料源" />

        <Arrow markerId={markerId} x1={170} y1={150} x2={230} y2={110} />
        <Arrow markerId={markerId} x1={170} y1={160} x2={230} y2={210} />

        <Box x={235} y={70} w={190} h={80} fill={FIXED_BLUE.fill} textColor={FIXED_BLUE.text} label="代購後台 Ops App" sublabel="Next.js + 記憶體快取" />
        <Box x={235} y={190} w={190} h={80} fill={FIXED_DEEP_BLUE.fill} textColor={FIXED_DEEP_BLUE.text} label="客戶前台 App" sublabel="Next.js（獨立部署）" />

        <Arrow markerId={markerId} x1={425} y1={230} x2={480} y2={230} />
        <Box x={485} y={195} w={110} h={70} fill={bg} textColor={ink} label="Public API" sublabel="唯一溝通管道" />

        <Arrow markerId={markerId} x1={595} y1={215} x2={650} y2={215} />
        <Box x={480} y={40} w={130} h={60} fill={FIXED_ACID.fill} textColor={FIXED_ACID.text} label="LINE OA" sublabel="LIFF ＋ 推播" />
        <Arrow markerId={markerId} x1={425} y1={100} x2={480} y2={70} />

        <text x={670} y={225} textAnchor="middle" style={{ fill: muted, fontSize: 22 }}>👤</text>
        <text x={670} y={250} textAnchor="middle" style={{ fill: muted, fontSize: 10, fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' }}>客戶</text>
      </g>
    </svg>
  )
}

/** Group-buy: the customer-facing ordering journey (flow chart). */
export function GroupBuyUserFlowDiagram() {
  return (
    <FlowChart
      ariaLabel="使用者流程圖：瀏覽開放中的團 → 選擇品項與數量送出訂單 → 用 LINE 綁定身分完成確認 → 到貨時收到 LINE 通知，隨時可查詢訂單狀態。"
      steps={[
        { label: '瀏覽開團', sub: '選品項／規格' },
        { label: '送出訂單', sub: '免註冊' },
        { label: 'LINE 身分確認', sub: 'LIFF 綁定', tone: 'blue' },
        { label: '到貨通知', sub: '推播＋查詢', tone: 'acid' },
      ]}
    />
  )
}

/** Street-dance research: linear artifact-driven flow from problem to the
 * mirror-vs-platform experiment and its engagement measures. */
export function ResearchFlowDiagram() {
  return (
    <FlowChart
      ariaLabel="研究流程圖：問題發現（傳統鏡像學習的沉浸感未知）→ 原型開發（MVP 課程平台）→ 正式實驗（鏡像學習組對比街舞平台組）→ 結果分析（沉浸感、臨場感、學習投入）。"
      steps={[
        { label: '問題發現', sub: '傳統鏡像學習\n沉浸感未知' },
        { label: '原型開發', sub: 'MVP 課程平台' },
        { label: '正式實驗', sub: '鏡像組 vs 平台組', tone: 'blue' },
        { label: '結果分析', sub: '沉浸／臨場／投入', tone: 'acid' },
      ]}
    />
  )
}

/** Street-dance platform: what a learner actually does in one session. */
export function DanceUserFlowDiagram() {
  return (
    <FlowChart
      ariaLabel="使用者流程圖：登入課程平台 → 觀看老師示範並切換左右鏡像 → 用逐幀動作分析疊圖對照自己的動作 → 系統記錄到學習歷程。"
      steps={[
        { label: '登入平台', sub: '選課程' },
        { label: '觀看示範', sub: '左右鏡像切換' },
        { label: '動作分析', sub: '逐幀疊圖對照', tone: 'blue' },
        { label: '學習歷程', sub: '進度自動記錄', tone: 'acid' },
      ]}
    />
  )
}

/** Full design system showcase with colors, typography (Aa), and components */
export function DesignSystemSection({
  colors,
  typography,
  components,
}: {
  colors: { name: string; hex: string; on?: 'light' | 'dark' }[]
  typography?: { name: string; fontFamily: string; weights?: number[] }[]
  components?: { name: string; preview: React.ReactNode }[]
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(48px, 6vw, 72px)' }}>
      {/* Color System */}
      <div>
        <p style={{
          fontSize: '11px', fontWeight: 600, letterSpacing: '0.14em',
          textTransform: 'uppercase', color: 'var(--color-accent)', margin: '0 0 24px',
        }}>
          Color System
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: '16px'
        }}>
          {colors.map((c) => (
            <div key={c.hex} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{
                width: '100%', aspectRatio: '1', borderRadius: '8px',
                backgroundColor: c.hex,
                border: c.on === 'light' ? `1px solid ${border}` : 'none',
              }} />
              <div>
                <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)', margin: 0 }}>
                  {c.name}
                </p>
                <p style={{
                  fontSize: '11px', color: 'var(--color-text-muted)', margin: '2px 0 0',
                  fontFamily: 'var(--font-geist-mono), ui-monospace, monospace'
                }}>
                  {c.hex}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Typography */}
      {typography && typography.length > 0 && (
        <div>
          <p style={{
            fontSize: '11px', fontWeight: 600, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: 'var(--color-accent)', margin: '0 0 24px',
          }}>
            Typography
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {typography.map((t) => (
              <div key={t.name} style={{
                padding: '24px',
                backgroundColor: surface,
                borderRadius: '8px',
                border: `1px solid ${border}`,
              }}>
                <p style={{
                  fontSize: '11px', fontWeight: 500, letterSpacing: '0.1em',
                  textTransform: 'uppercase', color: 'var(--color-text-muted)', margin: '0 0 16px'
                }}>
                  {t.name}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'baseline' }}>
                  {(t.weights || [400, 500, 600, 700]).map((weight) => (
                    <div key={weight} style={{ textAlign: 'center' }}>
                      <p style={{
                        fontFamily: t.fontFamily,
                        fontWeight: weight,
                        fontSize: 'clamp(48px, 8vw, 72px)',
                        lineHeight: 1,
                        color: 'var(--color-text-primary)',
                        margin: 0,
                      }}>
                        Aa
                      </p>
                      <p style={{
                        fontSize: '11px', color: 'var(--color-text-muted)',
                        margin: '8px 0 0',
                        fontFamily: 'var(--font-geist-mono), ui-monospace, monospace'
                      }}>
                        {weight}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Components */}
      {components && components.length > 0 && (
        <div>
          <p style={{
            fontSize: '11px', fontWeight: 600, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: 'var(--color-accent)', margin: '0 0 24px',
          }}>
            Components
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px'
          }}>
            {components.map((comp) => (
              <div key={comp.name} style={{
                padding: '24px',
                backgroundColor: surface,
                borderRadius: '8px',
                border: `1px solid ${border}`,
              }}>
                <p style={{
                  fontSize: '11px', fontWeight: 500, letterSpacing: '0.1em',
                  textTransform: 'uppercase', color: 'var(--color-text-muted)', margin: '0 0 16px'
                }}>
                  {comp.name}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                  {comp.preview}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/** A small, honestly-scoped snapshot of a shipped product's visual language
 * — not a full design-system spec, just the palette/type actually observed
 * in the live UI, presented as swatches. `approximate` flags colors read off
 * a screenshot rather than sampled from a running page. */
export function DesignSystemSnapshot({
  title, swatches, typeface, approximate,
}: {
  title: string
  swatches: { name: string; hex: string; on?: 'light' | 'dark' }[]
  typeface: string
  approximate?: boolean
}) {
  return (
    <div style={{
      border: `1px solid ${border}`, borderRadius: '12px',
      padding: '24px', backgroundColor: surface,
    }}>
      <p style={{
        fontSize: '11px', fontWeight: 500, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: 'var(--color-accent)', margin: '0 0 16px',
      }}>
        {title}{approximate ? '（視覺印象，近似色）' : ''}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '18px' }}>
        {swatches.map((s) => (
          <div key={s.hex} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', width: '84px' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '10px',
              backgroundColor: s.hex,
              border: s.on === 'light' ? `1px solid ${border}` : 'none',
            }} />
            <span style={{ fontSize: '11px', color: 'var(--color-text-primary)', textAlign: 'center' }}>{s.name}</span>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' }}>{s.hex}</span>
          </div>
        ))}
      </div>
      <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
        Typeface: <span style={{ color: 'var(--color-text-primary)' }}>{typeface}</span>
      </p>
    </div>
  )
}

/** A grid of real shipped-UI screenshots — the "UI mockup" artifact a
 * portfolio reviewer expects to see, distinct from the hand-drawn diagrams
 * above. Images sit in /public/case-studies/... (static assets, not CMS
 * content, since they're fixed to this specific write-up). */
export function MockupGallery({
  title, shots,
}: {
  title: string
  shots: { src: string; alt: string; label: string }[]
}) {
  return (
    <div>
      <p style={{
        fontSize: '11px', fontWeight: 500, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: 'var(--color-accent)', margin: '0 0 12px',
      }}>
        {title}
      </p>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px',
      }}>
        {shots.map((s) => (
          <figure key={s.src} style={{ margin: 0 }}>
            <div style={{
              border: `1px solid ${border}`, borderRadius: '8px', overflow: 'hidden',
              backgroundColor: surface,
            }}>
              <Image src={s.src} alt={s.alt} width={1200} height={800}
                sizes="(max-width: 768px) 100vw, 33vw" style={{ width: '100%', height: 'auto', display: 'block' }} />
            </div>
            <figcaption style={{
              fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '6px',
              fontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
            }}>
              {s.label}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}

/** An embedded prototype walkthrough recording, with native controls. */
export function PrototypeVideo({ title, src, note }: { title: string; src: string; note?: string }) {
  return (
    <div>
      <p style={{
        fontSize: '11px', fontWeight: 500, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: 'var(--color-accent)', margin: '0 0 12px',
      }}>
        {title}
      </p>
      <video
        src={src}
        controls
        playsInline
        style={{
          width: '100%', borderRadius: '8px', border: `1px solid ${border}`,
          backgroundColor: '#000', display: 'block',
        }}
      />
      {note && (
        <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '8px' }}>{note}</p>
      )}
    </div>
  )
}

/** A single documentary photo (fieldwork / pilot test / demo day) — evidence
 * that user research actually happened somewhere other than a spreadsheet. */
export function PhotoHighlight({ src, alt, caption }: { src: string; alt: string; caption: string }) {
  return (
    <figure style={{ margin: 0, maxWidth: '420px' }}>
      <div style={{ border: `1px solid ${border}`, borderRadius: '8px', overflow: 'hidden' }}>
        <Image src={src} alt={alt} width={840} height={1120}
          sizes="(max-width: 768px) 100vw, 420px" style={{ width: '100%', height: 'auto', display: 'block' }} />
      </div>
      <figcaption style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '8px' }}>
        {caption}
      </figcaption>
    </figure>
  )
}
