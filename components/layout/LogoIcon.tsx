'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'

export function LogoIcon({ size = 28 }: { size?: number }) {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const update = () =>
      setIsDark(document.documentElement.classList.contains('dark'))
    update()
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  return (
    <span data-logo-target style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
      <Image
        src={isDark ? '/logo-dark.svg' : '/logo-light.svg'}
        alt="Logo"
        width={size}
        height={size}
        priority
      />
    </span>
  )
}
