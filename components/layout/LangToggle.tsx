'use client'
import { useLocale } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'

export function LangToggle() {
  const locale   = useLocale()
  const router   = useRouter()
  const pathname = usePathname()

  function switchLocale(next: string) {
    router.replace(pathname, { locale: next })
  }

  return (
    <div className="hard-block" style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '13px', fontWeight: 500, padding: '6px 12px', borderRadius: 0, boxShadow: '3px 3px 0 var(--color-ink)', fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' }}>
      {routing.locales.map((l, i) => (
        <span key={l} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          {i > 0 && (
            <span style={{ color: 'var(--color-border)', margin: '0 2px' }}>/</span>
          )}
          <button
            onClick={() => switchLocale(l)}
            style={{
              background: 'none',
              border: 'none',
              padding: '2px 4px',
              cursor: locale === l ? 'default' : 'pointer',
              color: locale === l ? 'var(--color-accent)' : 'var(--color-text-muted)',
              fontWeight: locale === l ? 600 : 400,
              fontSize: 'inherit',
              fontFamily: 'inherit',
              transition: 'color 0.15s',
            }}
          >
            {l.toUpperCase()}
          </button>
        </span>
      ))}
    </div>
  )
}
