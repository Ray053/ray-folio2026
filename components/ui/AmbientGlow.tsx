'use client'

/**
 * Soft drifting radial-gradient glows — pure CSS, sits behind content.
 * Parent must be position: relative; content above must have zIndex >= 1.
 */
export function AmbientGlow() {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <span className="ambient-glow ambient-glow-a" />
      <span className="ambient-glow ambient-glow-b" />
      <span className="ambient-glow ambient-glow-c" />
    </div>
  )
}
