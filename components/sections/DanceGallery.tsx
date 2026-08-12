'use client'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { DanceVideo } from '@/lib/payload'

/**
 * Tall pinned Dance region. The 3D video cylinder + particle ball render over
 * this from the fixed JourneyBall canvas; this section just provides the scroll
 * length (#dance-zone), the bauhaus title, and a static fallback grid for
 * reduced-motion / no-WebGL.
 */
export function DanceGallery({ items }: { items: DanceVideo[] }) {
  const t = useTranslations('danceTeaser')
  const [fallback, setFallback] = useState(false)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let webgl = true
    try {
      const c = document.createElement('canvas')
      webgl = !!(c.getContext('webgl2') || c.getContext('webgl'))
    } catch { webgl = false }
    setFallback(reduce || !webgl)
  }, [])

  if (fallback) {
    return (
      <section id="dance-zone" style={{
        position: 'relative', backgroundColor: 'transparent',
        padding: 'clamp(48px, 7vw, 88px) 24px',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p className="mono-label" style={{ marginBottom: '12px' }}>{'// '}{t('eyebrow')}</p>
          <h2 style={{
            fontFamily: 'var(--font-syne), ui-sans-serif', fontSize: 'clamp(28px, 3.5vw, 48px)',
            fontWeight: 700, textTransform: 'uppercase', margin: '0 0 32px',
          }}>
            {t('heading')}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
            {items.map(it => (
              <div key={it.id} className="hard-block" style={{ borderRadius: 0, overflow: 'hidden' }}>
                {it.videoSrc
                  ? <video src={it.videoSrc} muted loop playsInline controls style={{ width: '100%', aspectRatio: '9/16', objectFit: 'cover', display: 'block' }} />
                  : <div style={{ width: '100%', aspectRatio: '9/16', background: 'var(--color-blue-pale)' }} />}
                <p className="mono-label" style={{ padding: '8px 10px', margin: 0, color: 'var(--color-ink)' }}>
                  {it.title} · {it.year}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="dance-zone" style={{
      position: 'relative', height: '320vh',
      backgroundColor: 'transparent',
    }}>
      <div style={{
        position: 'sticky', top: 0, height: '100vh',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: 'clamp(32px, 5vw, 64px) 24px', pointerEvents: 'none',
      }}>
        <div style={{ pointerEvents: 'auto' }}>
          <p className="mono-label" style={{ marginBottom: '8px' }}>{'// '}{t('eyebrow')}</p>
          <h2 style={{
            fontFamily: 'var(--font-syne), ui-sans-serif', fontSize: 'clamp(28px, 3.5vw, 56px)',
            fontWeight: 700, textTransform: 'uppercase', margin: 0,
          }}>
            {t('heading')}
          </h2>
        </div>
        <p className="mono-label" style={{ alignSelf: 'center', color: 'var(--color-text-muted)', margin: 0 }}>
          {'// SCROLL'}
        </p>
      </div>
    </section>
  )
}
