'use client'
import { useTranslations } from 'next-intl'

export function Footer() {
  const t = useTranslations('footer')
  return (
    <footer
      style={{
        borderTop: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        padding: '40px 24px',
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
              fontSize: '14px',
              color: 'var(--color-text-muted)',
              margin: 0,
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
            fontSize: '12px',
            color: 'var(--color-text-muted)',
            margin: 0,
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
        fontSize: '14px',
        color: 'var(--color-text-secondary)',
        textDecoration: 'none',
        transition: 'color 0.15s',
      }}
    >
      {label}
    </a>
  )
}
