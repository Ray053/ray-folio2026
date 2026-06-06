'use client'
import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

const SVG_SIZE = 110
const VB       = 432           // viewBox size
const STEP     = 7             // sampling grid step in viewBox units

const LOGO_PATHS = [
  "M90.3108 92.1917L125.993 92.1547C141.562 92.1437 156.373 90.8907 171.411 95.7057C224.916 112.836 234.683 179.093 193.662 214.958C186.603 221.13 179.748 224.462 171.474 228.6C174.806 231.805 182.011 241.351 185.105 245.309L211.93 280.052L240.632 316.914C245.705 323.361 254.02 333.367 258.31 339.975C249.616 340.083 240.923 340.266 232.233 340.524C221.396 340.793 212.147 341.33 201.323 339.459C181.888 336.1 163.051 325.623 151.739 309.147C143.027 296.599 139.741 281.068 142.624 266.067C145.903 249.25 157.442 237.997 171.218 228.704C158.877 233.34 151.235 235.332 138.107 236.439C137.335 215.382 137.93 189.763 137.98 168.495C114.122 165.608 86.6328 174.845 67.2678 158.788C59.6438 152.352 54.9198 143.124 54.1578 133.175C52.2478 110.379 67.8718 93.7717 90.3108 92.1917ZM181.198 165.907C189.438 164.329 194.823 156.349 193.201 148.118C191.579 139.886 183.569 134.545 175.347 136.212C167.187 137.866 161.896 145.801 163.506 153.969C165.115 162.138 173.021 167.472 181.198 165.907Z",
  "M263.345 95.7617C264.058 95.7077 264.28 95.6807 264.856 95.6697C274.538 95.4067 283.913 99.0817 290.836 105.855C304.035 118.885 300.608 133.82 301.079 150.597C301.173 153.962 301.095 157.361 301.112 160.73L301.376 242.891C298.716 244.095 295.883 245.169 293.103 246.064C271.1 253.149 249.24 261.024 226.907 267.008C249.343 266.235 275.802 267.033 298.618 266.971L328.105 266.9C342.021 266.88 354.853 265.913 366.284 275.693C375.387 283.481 377.968 292.166 378.973 303.766C377.693 314.329 375.332 322.559 367.122 330.043C362.393 334.328 356.622 337.294 350.385 338.644C343.952 339.981 325.424 339.031 317.487 339.111C304.799 339.24 289.406 339.81 276.815 339.233C270.103 332.269 260.733 319.16 254.477 310.867C247.207 301.231 234.31 286.593 228.238 277.044C227.866 268.68 228.362 259.431 228.322 250.963L227.908 193.231L227.822 157.592C227.799 143.503 226.688 127.241 233.945 114.675C240.667 103.035 250.306 97.4257 263.345 95.7617Z",
  "M87.0968 178.596C98.1428 177.994 105.885 179.267 115.17 185.606C131.998 197.095 130.366 213.04 130.413 230.808L130.515 267.064C130.523 274.453 130.558 282.009 130.762 289.334C131.12 302.176 131.349 313.644 123.432 324.476C116.825 333.516 108.952 337.95 98.0568 339.866C88.6048 340.657 79.9378 339.474 71.8308 334.201C63.3558 328.643 57.4678 319.913 55.4908 309.973C54.1248 303.076 54.4788 293.341 54.4818 286.164L54.5158 256.471L54.5088 229.654C54.5088 209.096 54.6848 191.89 76.3108 181.711C80.0638 179.945 83.0248 179.374 87.0968 178.596Z",
]

type Dot = {
  x: number; y: number
  tx: number; ty: number
  vx: number; vy: number
  k: number           // spring stiffness → speed difference
  alpha: number
  size: number
  startFrame: number
  arrived: number     // 0→1 settle amount
}

export function LoadingScreen() {
  const overlayRef = useRef<HTMLDivElement>(null)
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const svgRef     = useRef<SVGSVGElement>(null)
  const path1Ref   = useRef<SVGPathElement>(null)
  const path2Ref   = useRef<SVGPathElement>(null)
  const path3Ref   = useRef<SVGPathElement>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const canvas  = canvasRef.current
    const overlay = overlayRef.current
    const svgEl   = svgRef.current
    const paths   = [path1Ref.current, path2Ref.current, path3Ref.current]
    if (!canvas || !overlay || !svgEl) return

    const ctx = canvas.getContext('2d')!
    canvas.width  = window.innerWidth
    canvas.height = window.innerHeight

    const cx = window.innerWidth  / 2
    const cy = window.innerHeight / 2

    gsap.set(paths, { opacity: 0 })
    gsap.set(svgEl, { opacity: 0 })
    document.body.style.overflow = 'hidden'

    // ── Sample target points inside the logo shape ─────────────
    const p2d = LOGO_PATHS.map(d => new Path2D(d))
    const scale = SVG_SIZE / VB
    const targets: { x: number; y: number }[] = []
    for (let py = 0; py <= VB; py += STEP) {
      for (let px = 0; px <= VB; px += STEP) {
        const inside = p2d.some(p => ctx.isPointInPath(p, px, py))
        if (inside) {
          targets.push({
            x: cx + (px - VB / 2) * scale,
            y: cy + (py - VB / 2) * scale,
          })
        }
      }
    }
    // Shuffle for organic stagger
    for (let i = targets.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[targets[i], targets[j]] = [targets[j], targets[i]]
    }

    // ── Build one particle per target ──────────────────────────
    const dots: Dot[] = targets.map((tgt) => {
      const angle  = Math.random() * Math.PI * 2
      const radius = 240 + Math.random() * Math.max(cx, cy)
      return {
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        tx: tgt.x,
        ty: tgt.y,
        vx: 0, vy: 0,
        // Speed difference: fast snappers vs slow drifters
        k: 0.035 + Math.random() * 0.075,
        alpha: 0,
        size: 0.8 + Math.random() * 1.6,
        startFrame: Math.floor(Math.random() * 22),
        arrived: 0,
      }
    })

    let frame = 0
    let phase: 'gather' | 'materialize' = 'gather'
    let raf: number

    const GATHER_END      = 105   // ~1.75s — let slow particles arrive
    const MATERIALIZE_END = 140

    const tick = () => {
      frame++
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const d of dots) {
        if (frame < d.startFrame) continue

        if (phase === 'gather') {
          d.alpha = Math.min(d.alpha + 0.06, 1)

          // Spring toward target — k varies per particle → speed difference
          const dx = d.tx - d.x
          const dy = d.ty - d.y
          d.vx += dx * d.k
          d.vy += dy * d.k
          d.vx *= 0.80
          d.vy *= 0.80
          d.x  += d.vx
          d.y  += d.vy

          const dist = Math.hypot(dx, dy)
          d.arrived = Math.max(d.arrived, 1 - Math.min(dist / 80, 1))
        } else {
          d.alpha = Math.max(0, d.alpha - 0.06)
        }

        if (d.alpha < 0.01) continue

        // Brighter as it settles into place
        const bright = 0.5 + d.arrived * 0.5
        const halo   = d.size * 3

        const glow = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, halo)
        glow.addColorStop(0,   `rgba(205, 230, 245, ${d.alpha * bright})`)
        glow.addColorStop(0.4, `rgba(100, 165, 210, ${d.alpha * 0.5})`)
        glow.addColorStop(1,   `rgba(60, 110, 160, 0)`)
        ctx.beginPath()
        ctx.arc(d.x, d.y, halo, 0, Math.PI * 2)
        ctx.fillStyle = glow
        ctx.fill()

        ctx.beginPath()
        ctx.arc(d.x, d.y, d.size * 0.7, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(225, 242, 255, ${d.alpha})`
        ctx.fill()
      }

      if (phase === 'gather' && frame >= GATHER_END) {
        phase = 'materialize'
        // Crisp logo fades in as particles dissolve into it
        gsap.to(svgEl, { opacity: 1, duration: 0.2 })
        gsap.fromTo(paths,
          { opacity: 0 },
          { opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power2.out' }
        )
      }

      if (phase === 'materialize' && frame >= MATERIALIZE_END) {
        cancelAnimationFrame(raf)
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        flyToNavbar()
        return
      }

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    function flyToNavbar() {
      const navLogo = document.querySelector('[data-logo-target]') as HTMLElement | null
      if (navLogo) gsap.set(navLogo, { opacity: 0 })

      if (!svgEl || !navLogo) {
        gsap.to(overlay, {
          opacity: 0, duration: 0.5,
          onComplete: () => { document.body.style.overflow = ''; setDone(true) },
        })
        return
      }

      gsap.to({}, { duration: 0.3, onComplete: () => {
        const svgRect = svgEl!.getBoundingClientRect()
        const navRect = navLogo!.getBoundingClientRect()
        const fromCX  = svgRect.left + svgRect.width  / 2
        const fromCY  = svgRect.top  + svgRect.height / 2
        const toCX    = navRect.left + navRect.width  / 2
        const toCY    = navRect.top  + navRect.height / 2
        const scaleTo = navRect.width / SVG_SIZE

        gsap.to(overlay, { opacity: 0, duration: 0.55, delay: 0.18, ease: 'power2.in' })
        gsap.to(svgEl!, {
          x: toCX - fromCX,
          y: toCY - fromCY,
          scale: scaleTo,
          transformOrigin: 'center center',
          duration: 0.72,
          ease: 'power4.inOut',
          onComplete: () => {
            gsap.to(navLogo, { opacity: 1, duration: 0.2 })
            document.body.style.overflow = ''
            setDone(true)
          },
        })
      }})
    }

    return () => {
      cancelAnimationFrame(raf)
      document.body.style.overflow = ''
      const navLogo = document.querySelector('[data-logo-target]') as HTMLElement | null
      if (navLogo) gsap.set(navLogo, { opacity: 1 })
    }
  }, [])

  if (done) return null

  return (
    <div
      ref={overlayRef}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        backgroundColor: 'var(--color-background)',
        color: 'var(--color-text-primary)',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      />
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)', pointerEvents: 'none',
      }}>
        <svg
          ref={svgRef}
          width={SVG_SIZE}
          height={SVG_SIZE}
          viewBox="0 0 432 432"
          fill="none"
          style={{ overflow: 'visible', display: 'block' }}
        >
          <path ref={path1Ref} fill="currentColor" d={LOGO_PATHS[0]} />
          <path ref={path2Ref} fill="currentColor" d={LOGO_PATHS[1]} />
          <path ref={path3Ref} fill="currentColor" d={LOGO_PATHS[2]} />
        </svg>
      </div>
    </div>
  )
}
