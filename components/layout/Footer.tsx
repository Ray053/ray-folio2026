'use client'
import { useTranslations } from 'next-intl'

export function Footer() {
  const t = useTranslations('footer')
  return (
    <footer
      style={{
        backgroundColor: 'transparent',
        color: 'var(--color-ink)',
        padding: 'clamp(48px, 7vw, 88px) 24px',
        position: 'relative', zIndex: 1,
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
              fontSize: 'clamp(20px, 3vw, 40px)',
              textTransform: 'uppercase', letterSpacing: '0.02em',
              color: 'var(--color-ink)', margin: 0, wordBreak: 'break-all',
            }}
          >
            ray70804@gmail.com
          </p>

          <div style={{ display: 'flex', gap: '24px' }}>
            <FooterLink href="https://github.com/" label="GitHub" />
            <FooterLink href="https://linkedin.com/" label="LinkedIn" />
          </div>
        </div>

        <p
          style={{
            fontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
            fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em',
            color: 'var(--color-text-secondary)', margin: 0,
          }}
        >
          © {new Date().getFullYear()} Ray. {t('rights')}.
        </p>
      </div>
    </footer>
  )
}

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        fontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
        fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.06em',
        color: 'var(--color-ink)',
        textDecoration: 'none',
        transition: 'color 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-accent)' }}
      onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-ink)' }}
    >
      {label}
    </a>
  )
}
