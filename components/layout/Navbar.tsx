'use client'
import { useRef, useEffect, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import gsap from 'gsap'
import { LangToggle } from './LangToggle'
import { LogoIcon } from './LogoIcon'

export function Navbar() {
  const t        = useTranslations('nav')
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const menuRef  = useRef<HTMLDivElement>(null)

  // Condense navbar once the hero section (100dvh) is scrolled past
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight - 70)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  // Animate menu in/out
  useEffect(() => {
    const menu = menuRef.current
    if (!menu) return

    if (open) {
      document.body.style.overflow = 'hidden'
      gsap.set(menu, { display: 'flex', yPercent: -100 })
      gsap.to(menu, { yPercent: 0, duration: 0.55, ease: 'power4.out' })
      gsap.from('.mobile-link', {
        y: 32, opacity: 0, duration: 0.5, ease: 'power4.out',
        stagger: 0.07, delay: 0.18,
      })
    } else {
      document.body.style.overflow = ''
      gsap.to(menu, {
        yPercent: -100, duration: 0.42, ease: 'power4.in',
        onComplete: () => gsap.set(menu, { display: 'none' }),
      })
    }
  }, [open])

  const close = useCallback(() => setOpen(false), [])

  // Close on route change
  useEffect(() => { close() }, [pathname, close])

  return (
    <>
      <header
        className={scrolled ? 'nav-condensed' : ''}
        style={{
          position: 'sticky', top: 0, zIndex: 50,
          padding: '0 16px',
          pointerEvents: 'none',   // let the page under the gaps stay interactive
        }}
      >
        <nav className="hard-block" style={{
          pointerEvents: 'auto',
          width: 'max-content', maxWidth: '100%',
          margin: '14px auto 0',
          padding: '8px 10px 8px 18px',
          height: '56px',
          display: 'flex', alignItems: 'center', gap: '8px',
          transition: 'padding 0.35s ease, margin 0.35s ease',
        }}>
          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <LogoIcon size={28} />
            <span className="nav-logo-name" style={{
              fontFamily: 'var(--font-syne), ui-sans-serif',
              fontWeight: 700, fontSize: '18px',
              color: 'var(--color-text-primary)', letterSpacing: '-0.02em',
            }}>
              Ray
            </span>
          </Link>

          {/* Desktop links */}
          <div className="nav-links-desktop" style={{ alignItems: 'center', gap: '4px' }}>
            <NavLink href="/work"  active={pathname === '/work'}>  {t('work')}  </NavLink>
            <NavLink href="/about" active={pathname === '/about'}> {t('about')} </NavLink>
            <a href="/cv.pdf" download style={{
              padding: '8px 16px', marginLeft: '6px', borderRadius: 0,
              border: '2px solid var(--color-ink)',
              background: 'var(--color-accent)', boxShadow: '4px 4px 0 var(--color-ink)',
              fontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
              fontSize: '13px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase',
              color: '#fff', textDecoration: 'none',
            }}>
              {t('downloadCV')}
            </a>
            <LangToggle />
          </div>

          {/* Hamburger (mobile only) */}
          <button
            className="nav-hamburger"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen(v => !v)}
            style={{
              alignItems: 'center', justifyContent: 'center',
              width: '40px', height: '40px',
              background: 'none', border: 'none',
              cursor: 'pointer', padding: 0,
              color: 'var(--color-text-primary)',
            }}
          >
            {open ? <XIcon /> : <HamburgerIcon />}
          </button>
        </nav>
      </header>

      {/* Mobile full-screen menu */}
      <div
        ref={menuRef}
        style={{
          display: 'none',          // GSAP sets to flex on open
          position: 'fixed',
          inset: 0,
          zIndex: 49,
          flexDirection: 'column',
          justifyContent: 'center',
          backgroundColor: 'var(--color-background)',
          padding: '80px 32px 40px',
        }}
      >
        {/* Nav links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, justifyContent: 'center' }}>
          <MobileLink href="/"      onClick={close} className="mobile-link">Home</MobileLink>
          <MobileLink href="/work"  onClick={close} className="mobile-link">{t('work')}</MobileLink>
          <MobileLink href="/about" onClick={close} className="mobile-link">{t('about')}</MobileLink>
          <a
            href="/cv.pdf"
            download
            className="mobile-link"
            onClick={close}
            style={{
              padding: '12px 0',
              fontFamily: 'var(--font-syne), ui-sans-serif',
              fontSize: 'clamp(28px, 8vw, 48px)',
              fontWeight: 700, letterSpacing: '-0.02em',
              color: 'var(--color-text-muted)', textDecoration: 'none',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            {t('downloadCV')}
          </a>
        </nav>

        {/* Bottom controls */}
        <div
          className="mobile-link"
          style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingTop: '32px' }}
        >
          <LangToggle />
        </div>
      </div>
    </>
  )
}

/* ── NavLink (desktop active indicator) ─────────────────── */
function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} style={{
      padding: '7px 12px', borderRadius: '6px',
      fontSize: '14px', fontWeight: active ? 600 : 500,
      color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
      textDecoration: 'none', position: 'relative',
    }}>
      {children}
      {active && (
        <span style={{
          position: 'absolute', bottom: '2px', left: '12px', right: '12px',
          height: '2px', borderRadius: '1px', backgroundColor: 'var(--color-accent)',
        }} />
      )}
    </Link>
  )
}

/* ── MobileLink ──────────────────────────────────────────── */
function MobileLink({ href, onClick, children, className }: {
  href: string; onClick: () => void; children: React.ReactNode; className?: string
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={className}
      style={{
        padding: '12px 0',
        fontFamily: 'var(--font-syne), ui-sans-serif',
        fontSize: 'clamp(28px, 8vw, 48px)',
        fontWeight: 700, letterSpacing: '-0.02em',
        color: 'var(--color-text-primary)', textDecoration: 'none',
        borderBottom: '1px solid var(--color-border)',
        display: 'block',
      }}
    >
      {children}
    </Link>
  )
}

/* ── Icons ───────────────────────────────────────────────── */
function HamburgerIcon() {
  return (
    <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
      <rect x="0" y="0"  width="22" height="2" rx="1" fill="currentColor"/>
      <rect x="0" y="7"  width="16" height="2" rx="1" fill="currentColor"/>
      <rect x="0" y="14" width="22" height="2" rx="1" fill="currentColor"/>
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <line x1="2" y1="2" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="18" y1="2" x2="2"  y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}
