'use client'
import { useEffect, useState } from 'react'

/**
 * A flowing liquid-metal (chrome) blob — an SVG shape filled with a chrome
 * gradient, warped by an animated turbulence displacement so its edge slowly
 * flows like liquid metal. Decorative; respects prefers-reduced-motion.
 */
export function LiquidChrome({ style }: { style?: React.CSSProperties }) {
  const [animate, setAnimate] = useState(false)
  useEffect(() => {
    setAnimate(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  return (
    <svg viewBox="0 0 200 200" aria-hidden style={style}>
      <defs>
        <linearGradient id="lc-chrome" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f6f8fb" />
          <stop offset="22%" stopColor="#c7ccd2" />
          <stop offset="42%" stopColor="#8a929c" />
          <stop offset="52%" stopColor="#565e68" />
          <stop offset="66%" stopColor="#aeb6be" />
          <stop offset="84%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#79818a" />
        </linearGradient>
        <radialGradient id="lc-gloss" cx="38%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <filter id="lc-liquid" x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.013 0.02" numOctaves="2" seed="4" result="noise">
            {animate && (
              <animate
                attributeName="baseFrequency"
                dur="16s"
                values="0.013 0.02;0.022 0.012;0.013 0.02"
                repeatCount="indefinite"
              />
            )}
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="26" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <g filter="url(#lc-liquid)">
        <circle cx="100" cy="100" r="64" fill="url(#lc-chrome)" />
        <circle cx="100" cy="100" r="64" fill="url(#lc-gloss)" />
      </g>
    </svg>
  )
}
