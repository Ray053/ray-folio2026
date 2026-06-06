// Shared scroll-velocity tracker — a single rAF loop feeds all consumers.

let velocity = 0
let lastY = 0
let running = false

function loop() {
  const y = window.scrollY
  const delta = y - lastY
  lastY = y
  // Smooth toward instantaneous delta; decays to 0 when idle
  velocity += (delta - velocity) * 0.18
  requestAnimationFrame(loop)
}

/** Start the tracker once (safe to call from many components). */
export function ensureVelocityTracker() {
  if (running || typeof window === 'undefined') return
  running = true
  lastY = window.scrollY
  loop()
}

/** Current smoothed scroll velocity in px/frame (signed: + = down). */
export function getScrollVelocity() {
  return velocity
}
