'use client'
import { useTranslations } from 'next-intl'

export function Footer() {
  const t = useTranslations('footer')
  return (
    <footer
      style={{
        borderTop: '2px solid var(--color-ink)',
        backgroundColor: 'var(--color-accent)',
        color: '#fff',
        padding: 'clamp(48px, 7vw, 88px) 24px',
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
              color: '#fff', margin: 0, wordBreak: 'break-all',
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
            color: 'rgba(255,255,255,0.75)', margin: 0,
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
        color: '#fff',
        textDecoration: 'none',
        transition: 'color 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-acid)' }}
      onMouseLeave={e => { e.currentTarget.style.color = '#fff' }}
    >
      {label}
    </a>
  )
}
