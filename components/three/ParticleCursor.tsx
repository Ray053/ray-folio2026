'use client'
import { useEffect, useRef } from 'react'

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
}

export function ParticleCursor() {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const particles  = useRef<Particle[]>([])
  const raf        = useRef<number>(0)
  const prevPos    = useRef({ x: 0, y: 0 })
  const velocity   = useRef(0)         // smoothed speed (px/event)
  const velDisplay = useRef(0)         // display-smoothed for size

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const onMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - prevPos.current.x
      const dy = e.clientY - prevPos.current.y
      const speed = Math.sqrt(dx * dx + dy * dy)

      // Smooth velocity with lerp
      velocity.current = velocity.current * 0.6 + speed * 0.4
      prevPos.current = { x: e.clientX, y: e.clientY }

      const rect = canvas.getBoundingClientRect()
      const cx = e.clientX - rect.left
      const cy = e.clientY - rect.top

      // Velocity maps to: size (1–8px), count (2–8), spread
      const v      = Math.min(velocity.current, 40)           // cap at 40px/event
      const t      = v / 40                                    // normalised 0→1
      const count  = Math.round(2 + t * 6)                    // 2 → 8 particles
      const spread = 4 + t * 12                               // wider spray at speed
      const sizeBase = 1 + t * 5                              // base size 1 → 6 px

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2
        const r     = Math.random() * spread
        particles.current.push({
          x:       cx + Math.cos(angle) * r,
          y:       cy + Math.sin(angle) * r,
          vx:      (Math.random() - 0.5) * (0.5 + t * 1.5),
          vy:      -(Math.random() * (1 + t * 1.5) + 0.2),
          life:    0,
          maxLife: 30 + Math.random() * 25,
          size:    sizeBase * (0.6 + Math.random() * 0.8),
        })
      }
    }

    window.addEventListener('mousemove', onMouseMove)

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Decay display velocity each frame (not just on mouse move)
      velDisplay.current = velDisplay.current * 0.92 + velocity.current * 0.08
      velocity.current  *= 0.88  // natural slowdown when mouse stops

      particles.current = particles.current.filter(p => p.life < p.maxLife)

      for (const p of particles.current) {
        p.x  += p.vx
        p.y  += p.vy
        p.vy *= 0.97
        p.life++

        const progress = p.life / p.maxLife
        const alpha    = (1 - progress) * 0.55
        const radius   = p.size * (1 - progress * 0.55)

        ctx.beginPath()
        ctx.arc(p.x, p.y, Math.max(0.1, radius), 0, Math.PI * 2)
        ctx.fillStyle = `rgba(10, 132, 255, ${alpha})`
        ctx.fill()
      }

      raf.current = requestAnimationFrame(tick)
    }
    tick()

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      cancelAnimationFrame(raf.current)
      ro.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    />
  )
}
