export type Vec2 = { x: number; y: number }
export interface Viewport { width: number; height: number }
export interface CameraParams { fov: number; distance: number }

// ── Tunable constants (safe to tweak while tuning the look) ──────────
export const JOURNEY = {
  camDistance: 6,   // camera z distance from the ball plane
  camFov: 40,       // perspective vertical FOV (deg)
  opacity: 0.62,    // ball translucency
} as const

export const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n)

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0))
  return t * t * (3 - 2 * t)
}

export const mix2 = (a: Vec2, b: Vec2, t: number): Vec2 => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
})

/** Screen pixel (top-left origin) → world x/y on the z=0 plane, perspective camera looking down -z from +z. */
export function screenToWorld(px: number, py: number, vp: Viewport, cam: CameraParams): Vec2 {
  const visibleHeight = 2 * cam.distance * Math.tan((cam.fov / 2) * Math.PI / 180)
  const visibleWidth = visibleHeight * (vp.width / vp.height)
  return {
    x: (px / vp.width - 0.5) * visibleWidth,
    y: (0.5 - py / vp.height) * visibleHeight,
  }
}

// ── Scale keyframes across journey progress 0..1 ─────────────────────
// 0.00–0.35 hero (big) → 0.35–0.62 about (shrink) → 0.62–1.0 projects (small)
export function ballScale(progress: number): number {
  const p = clamp01(progress)
  const big = 1.0, mid = 0.5, small = 0.3
  if (p < 0.35) return big
  if (p < 0.62) return lerp(big, mid, smoothstep(0.35, 0.62, p))
  return lerp(mid, small, smoothstep(0.62, 1.0, p))
}

// Slightly more opaque as it shrinks so the small ball still reads.
export function ballOpacity(progress: number): number {
  const p = clamp01(progress)
  return lerp(JOURNEY.opacity, Math.min(JOURNEY.opacity + 0.15, 0.85), smoothstep(0.6, 1.0, p))
}
