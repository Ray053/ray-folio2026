'use client'
import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// One continuous path (normalized 0..1 over the wrapper):
// top-centre → swing right → swing left behind the photo → down to mid →
// swing right → descend the right side to the bottom.
const PATH_D =
  'M 0.50 0.01 ' +
  'C 0.94 0.10, 0.08 0.24, 0.46 0.38 ' +
  'C 0.66 0.48, 0.92 0.66, 0.88 0.99'

/**
 * A single colourful ball that travels one continuous trajectory across the
 * profile + projects sections it wraps. Sits behind the (transparent) sections.
 */
export function UnifiedTrajectory({ children }: { children: React.ReactNode }) {
  const wrapRef  = useRef<HTMLDivElement>(null)
  const layerRef = useRef<HTMLDivElement>(null)
  const pathRef  = useRef<SVGPathElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const path = pathRef.current
      const layer = layerRef.current
      if (!path || !layer) return

      const len = path.getTotalLength()
      path.style.strokeDasharray  = `${len}`
      path.style.strokeDashoffset = `${len}`

      ScrollTrigger.create({
        trigger: wrapRef.current,
        start: 'top 75%',
        end: 'bottom 60%',
        scrub: true,
        onUpdate: (self) => {
          // Draw the trail on as you scroll; the travelling ball is now the
          // page-level 3D JourneyBall, which reads #journey-path / #journey-layer.
          path.style.strokeDashoffset = `${len * (1 - self.progress)}`
        },
      })
    }, wrapRef)
    return () => ctx.revert()
  }, [])

  return (
    <div ref={wrapRef} style={{ position: 'relative', backgroundColor: 'transparent' }}>
      {/* Trajectory layer — behind the transparent sections */}
      <div
        ref={layerRef}
        id="journey-layer"
        aria-hidden
        style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}
      >
        <svg width="100%" height="100%" viewBox="0 0 1 1" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <linearGradient id="uni-trail" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%"   stopColor="#001B3D" />
              <stop offset="30%"  stopColor="#0060DF" />
              <stop offset="55%"  stopColor="#0A84FF" />
              <stop offset="80%"  stopColor="#5AB0FF" />
              <stop offset="100%" stopColor="#EAF4FF" />
            </linearGradient>
          </defs>
          <path
            ref={pathRef}
            id="journey-path"
            d={PATH_D}
            fill="none" stroke="url(#uni-trail)" strokeWidth={2}
            vectorEffect="non-scaling-stroke" strokeLinecap="round" opacity={0.72}
          />
        </svg>
      </div>

      {/* Sections (transparent backgrounds) above the trajectory */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  )
}
