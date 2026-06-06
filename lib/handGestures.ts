import { getHandLandmarks } from './poseTracking'

type Pt = { x: number; y: number }
const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y)

export type Gestures = { present: boolean; fist: boolean; pinch: boolean }

/** Detect fist / pinch from the first tracked hand (normalized landmarks). */
export function getGestures(): Gestures {
  const hands = getHandLandmarks()
  if (!hands || !hands.length) return { present: false, fist: false, pinch: false }
  const h = hands[0]
  if (!h || h.length < 21) return { present: false, fist: false, pinch: false }

  const wrist = h[0]

  // Pinch: thumb tip (4) touching index tip (8), with index extended
  const indexExtended = dist(h[8], wrist) > dist(h[6], wrist)
  const pinch = dist(h[4], h[8]) < 0.06 && indexExtended

  // Fist: all four fingers curled (tip closer to wrist than its PIP joint)
  const fingers: [number, number][] = [[8, 6], [12, 10], [16, 14], [20, 18]]
  let curled = 0
  for (const [tip, pip] of fingers) {
    if (dist(h[tip], wrist) < dist(h[pip], wrist)) curled++
  }
  const fist = curled >= 4

  return { present: true, fist, pinch }
}
